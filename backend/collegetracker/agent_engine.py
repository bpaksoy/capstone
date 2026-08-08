import os
import time
import logging
from typing import Generator, Dict, Any, List, Optional
from google import genai
from google.genai import types
from collegetracker import agent_tools
from collegetracker.models import ChatMessage, AICallLog

logger = logging.getLogger(__name__)


class WormieManagedAgent:
    """
    Wormie Managed Agent Engine powered by Google Gemini (Google GenAI SDK).
    Provides autonomous tool-calling, multi-step reasoning, and streaming responses
    for prospective college students.
    """

    def __init__(self, model_name: str = "gemini-2.0-flash"):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None
        self.model_name = model_name

    def _build_tools_for_user(self, user, executed_actions: List[str]):
        """
        Creates user-bound tool closures so the Gemini model can execute database
        actions securely on behalf of the authenticated user.
        """
        def get_college_info(college_name: str) -> Dict[str, Any]:
            """Retrieve official IPEDS admissions, cost, graduation rate, and earnings data for a college."""
            return agent_tools.get_college_details(college_name)

        def search_universities(
            state: Optional[str] = None,
            max_tuition: Optional[int] = None,
            min_sat: Optional[int] = None,
            major_keyword: Optional[str] = None,
            limit: int = 5
        ) -> Dict[str, Any]:
            """Search and filter colleges by state, max tuition, SAT score, or major keyword."""
            return agent_tools.search_colleges(
                state=state,
                max_tuition=max_tuition,
                min_sat=min_sat,
                major_keyword=major_keyword,
                limit=limit
            )

        def evaluate_admission_chances(
            college_name: str,
            student_gpa: Optional[float] = None,
            student_sat: Optional[int] = None
        ) -> Dict[str, Any]:
            """Calculate Safety/Target/Reach probability by benchmarking metrics against official IPEDS percentiles."""
            # Fall back to user's saved profile if omitted
            if user and user.is_authenticated:
                student_gpa = student_gpa or getattr(user, 'gpa', None)
                student_sat = student_sat or getattr(user, 'sat_score', None)
            return agent_tools.calculate_admission_chances(
                college_name=college_name,
                student_gpa=student_gpa,
                student_sat=student_sat
            )

        def save_bookmark(college_name: str) -> Dict[str, Any]:
            """Save a college to the user's bookmarks list."""
            res = agent_tools.bookmark_college(user=user, college_name=college_name)
            if res.get("status") == "SUCCESS" and "badge_tag" in res:
                executed_actions.append(res["badge_tag"])
            return res

        def connect_with_admissions(college_name: str) -> Dict[str, Any]:
            """Submit student lead to the college's recruiter portal."""
            res = agent_tools.submit_recruiter_lead(user=user, college_name=college_name)
            if res.get("status") == "SUCCESS" and "badge_tag" in res:
                executed_actions.append(res["badge_tag"])
            return res

        return [
            get_college_info,
            search_universities,
            evaluate_admission_chances,
            save_bookmark,
            connect_with_admissions
        ]

    def _build_system_prompt(self, user) -> str:
        student_info = "Guest Student"
        if user and user.is_authenticated:
            student_info = (
                f"Student Username: {user.username}\n"
                f"- High School GPA: {getattr(user, 'gpa', 'Not specified')}\n"
                f"- Composite SAT: {getattr(user, 'sat_score', 'Not specified')}\n"
                f"- Desired Major: {getattr(user, 'major', 'Undecided')}\n"
                f"- Location: {getattr(user, 'city', '')}, {getattr(user, 'state', '')}"
            )

        return f"""You are Wormie, the premier AI College Admissions Counselor and Agent for higher education discovery.

AUTHENTICATED STUDENT CONTEXT:
{student_info}

CAPABILITIES & AUTONOMOUS TOOLS:
You are equipped with real-time verified IPEDS database tools:
1. `get_college_info`: Retrieve accurate admissions rates, tuition, SAT averages, and graduation rates.
2. `search_universities`: Find colleges matching budget, location, or SAT scores.
3. `evaluate_admission_chances`: Run statistical admissions chances (Safety, Target, Reach).
4. `save_bookmark`: Bookmark a university directly to the student's profile.
5. `connect_with_admissions`: Submit student credentials to the university admissions recruiter.

AGENT INSTRUCTIONS:
- Whenever a student asks about stats, tuition, or comparisons, ALWAYS use your tools to fetch verified IPEDS numbers.
- When evaluating chances, use `evaluate_admission_chances` to benchmark their metrics.
- If the user asks to save, bookmark, or track a school, execute `save_bookmark`.
- If the user asks to connect with recruiters or express interest, execute `connect_with_admissions`.
- When an action is taken, also output the action tag so the frontend badges render:
  - `[[ACTION: BOOKMARK, College: <Name>]]`
  - `[[ACTION: SUBMIT_LEAD, College: <Name>]]`
- Be encouraging, highly knowledgeable, and data-driven. Use bolding for key statistics.
"""

    def stream_chat(
        self,
        user_message: str,
        user=None,
        chat_history: Optional[List[Dict[str, Any]]] = None
    ) -> Generator[str, None, None]:
        """
        Executes the agent loop with streaming output and automatic tool calling.
        Yields text chunks for HTTP streaming.
        """
        if not self.api_key:
            self.api_key = os.environ.get("GEMINI_API_KEY")
            if self.api_key:
                self.client = genai.Client(api_key=self.api_key)

        if not self.client:
            yield "Wormie AI is currently offline. Please configure GEMINI_API_KEY."
            return

        start_time = time.time()
        full_response_text = ""
        success = True
        executed_actions: List[str] = []

        tools = self._build_tools_for_user(user, executed_actions)
        system_instruction = self._build_system_prompt(user)

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=tools,
            temperature=0.7,
        )

        models_to_try = [self.model_name]
        if self.model_name != "gemini-flash-latest":
            models_to_try.append("gemini-flash-latest")

        chat = None
        last_error = None

        for model_candidate in models_to_try:
            try:
                # Format history for Google GenAI SDK if provided
                history_contents = []
                if chat_history:
                    for msg in chat_history[-6:]:
                        role = msg.get("role")
                        parts = msg.get("parts", [""])
                        text_val = parts[0] if isinstance(parts, list) and parts else str(parts)
                        if role and text_val:
                            history_contents.append(
                                types.Content(
                                    role="user" if role == "user" else "model",
                                    parts=[types.Part.from_text(text=text_val)]
                                )
                            )

                chat = self.client.chats.create(
                    model=model_candidate,
                    config=config,
                    history=history_contents if history_contents else None
                )

                response = chat.send_message(user_message)
                if response and response.text:
                    full_response_text = response.text
                    break
            except Exception as candidate_err:
                last_error = candidate_err
                err_str = str(candidate_err).lower()
                if "429" in err_str or "quota" in err_str or "404" in err_str:
                    logger.warning(f"Model {model_candidate} hit quota/error ({candidate_err}), trying next candidate...")
                    continue
                else:
                    logger.error(f"Error calling {model_candidate}: {candidate_err}")
                    break

        try:
            if not full_response_text:
                if last_error:
                    raise last_error
                else:
                    raise Exception("No response generated from AI.")

            # Ensure any executed actions have their badge tag in the response
            for tag in executed_actions:
                if tag not in full_response_text:
                    full_response_text += f"\n\n{tag}"

            # Stream chunks (e.g. by words/phrases) for smooth real-time rendering in frontend
            words = full_response_text.split(" ")
            chunk_size = 4
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i:i + chunk_size])
                if i + chunk_size < len(words):
                    chunk += " "
                yield chunk
                time.sleep(0.015)

            # Persist chat history to database
            if user and user.is_authenticated and full_response_text:
                ChatMessage.objects.create(
                    user=user,
                    role="model",
                    content=full_response_text
                )

        except Exception as e:
            success = False
            logger.error(f"Error in WormieManagedAgent: {e}", exc_info=True)
            yield f"\n[Agent Notification: {str(e)}]"
        finally:
            latency_ms = int((time.time() - start_time) * 1000)
            try:
                AICallLog.objects.create(
                    user=user if user and user.is_authenticated else None,
                    prompt_summary=user_message[:500],
                    response_summary=full_response_text[:1000],
                    latency_ms=latency_ms,
                    success=success
                )
            except Exception as log_err:
                logger.error(f"Error saving AICallLog: {log_err}")
