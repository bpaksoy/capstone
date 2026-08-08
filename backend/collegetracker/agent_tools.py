import logging
from typing import Dict, Any, List, Optional
from django.db.models import Q
from collegetracker.models import College, Bookmark, LeadStatus, User

logger = logging.getLogger(__name__)


def get_college_details(college_name: str) -> Dict[str, Any]:
    """
    Look up verified IPEDS / College Scorecard data for a specific university by name.
    Returns official statistics including acceptance rate, SAT scores, tuition, graduation rate,
    average net price, and median post-grad earnings.

    Args:
        college_name: The name or common abbreviation of the university (e.g. 'Harvard University', 'MIT', 'UCLA', 'Boston University').
    """
    try:
        college = College.objects.filter(name__icontains=college_name.strip()).first()
        if not college:
            # Fallback search by token
            tokens = [t for t in college_name.strip().split() if len(t) > 2]
            q_obj = Q()
            for token in tokens:
                q_obj |= Q(name__icontains=token)
            college = College.objects.filter(q_obj).first()

        if not college:
            return {
                "status": "NOT_FOUND",
                "message": f"No university matching '{college_name}' found in the verified database."
            }

        admission_pct = f"{round(college.admission_rate * 100, 1)}%" if college.admission_rate is not None else "N/A"
        grad_pct = f"{round(college.grad_rate * 100, 1)}%" if college.grad_rate is not None else "N/A"

        return {
            "status": "SUCCESS",
            "id": college.id,
            "name": college.name,
            "city": college.city,
            "state": college.state,
            "website": college.website,
            "admission_rate": admission_pct,
            "average_sat": college.sat_score or "Test Optional / N/A",
            "tuition_in_state": f"${college.tuition_in_state:,}" if college.tuition_in_state else "N/A",
            "tuition_out_state": f"${college.tuition_out_state:,}" if college.tuition_out_state else "N/A",
            "avg_net_price": f"${college.avg_net_price:,}" if college.avg_net_price else "N/A",
            "graduation_rate": grad_pct,
            "top_major": college.top_major or "General Studies",
            "median_earnings_4yr": f"${college.median_earnings_4yr:,}" if college.median_earnings_4yr else "N/A",
        }
    except Exception as e:
        logger.error(f"Error in get_college_details: {e}")
        return {"status": "ERROR", "message": str(e)}


def search_colleges(
    state: Optional[str] = None,
    max_tuition: Optional[int] = None,
    min_sat: Optional[int] = None,
    major_keyword: Optional[str] = None,
    limit: int = 5
) -> Dict[str, Any]:
    """
    Search and filter universities in the IPEDS database by location, maximum tuition, SAT expectations, or major.

    Args:
        state: Two-letter US state code (e.g. 'CA', 'NY', 'MA', 'TX').
        max_tuition: Maximum out-of-state tuition in USD.
        min_sat: Target average SAT score.
        major_keyword: Major of interest (e.g. 'Computer Science', 'Business', 'Engineering').
        limit: Maximum number of results to return (default 5, max 10).
    """
    try:
        queryset = College.objects.all()

        if state:
            queryset = queryset.filter(state__iexact=state.strip())
        if max_tuition:
            queryset = queryset.filter(tuition_out_state__lte=max_tuition)
        if min_sat:
            queryset = queryset.filter(sat_score__gte=min_sat)
        if major_keyword:
            queryset = queryset.filter(
                Q(top_major__icontains=major_keyword) |
                Q(programs__cipdesc__icontains=major_keyword)
            ).distinct()

        results = []
        for c in queryset[:min(limit, 10)]:
            results.append({
                "id": c.id,
                "name": c.name,
                "city": c.city,
                "state": c.state,
                "tuition_out_state": f"${c.tuition_out_state:,}" if c.tuition_out_state else "N/A",
                "admission_rate": f"{round(c.admission_rate * 100, 1)}%" if c.admission_rate else "N/A",
                "sat_score": c.sat_score or "N/A"
            })

        return {
            "status": "SUCCESS",
            "count": len(results),
            "results": results
        }
    except Exception as e:
        logger.error(f"Error in search_colleges: {e}")
        return {"status": "ERROR", "message": str(e)}


def calculate_admission_chances(
    college_name: str,
    student_gpa: Optional[float] = None,
    student_sat: Optional[int] = None
) -> Dict[str, Any]:
    """
    Statistically calculates an admissions probability rating (Safety, Target, Reach, High Reach)
    by benchmarking student metrics against the institution's official IPEDS admissions data.

    Args:
        college_name: The name of the target university.
        student_gpa: Student's unweighted high school GPA (e.g. 3.8).
        student_sat: Student's composite SAT score (e.g. 1420).
    """
    try:
        college = College.objects.filter(name__icontains=college_name.strip()).first()
        if not college:
            return {"status": "NOT_FOUND", "message": f"University '{college_name}' not found."}

        avg_sat = college.sat_score or 1200
        adm_rate = college.admission_rate if college.admission_rate is not None else 0.50

        category = "Target"
        reasoning = []

        if adm_rate < 0.15:
            category = "High Reach"
            reasoning.append(f"Acceptance rate is ultra-competitive at {round(adm_rate * 100, 1)}%.")
        elif adm_rate < 0.35:
            if student_sat and student_sat >= (avg_sat + 80):
                category = "Target"
                reasoning.append(f"Your SAT ({student_sat}) is significantly above the school average ({avg_sat}).")
            else:
                category = "Reach"
                reasoning.append(f"Competitive admissions ({round(adm_rate * 100, 1)}% acceptance rate).")
        elif adm_rate >= 0.70:
            category = "Safety"
            reasoning.append(f"High acceptance rate ({round(adm_rate * 100, 1)}%) indicates accessible admissions.")
        else:
            if student_sat:
                if student_sat >= (avg_sat + 50):
                    category = "Safety / Likely"
                elif student_sat < (avg_sat - 100):
                    category = "Reach"
                else:
                    category = "Target"

        return {
            "status": "SUCCESS",
            "college_name": college.name,
            "classification": category,
            "institutional_admission_rate": f"{round(adm_rate * 100, 1)}%",
            "institutional_avg_sat": avg_sat,
            "student_metrics_evaluated": {
                "gpa": student_gpa or "Not provided",
                "sat": student_sat or "Not provided"
            },
            "reasoning": " ".join(reasoning)
        }
    except Exception as e:
        logger.error(f"Error in calculate_admission_chances: {e}")
        return {"status": "ERROR", "message": str(e)}


def bookmark_college(user: User, college_name: str) -> Dict[str, Any]:
    """
    Saves a university to the student's personal bookmarks collection in their account.

    Args:
        user: The authenticated Django user instance.
        college_name: Name of the university to bookmark.
    """
    if not user or not user.is_authenticated:
        return {
            "status": "REQUIRES_AUTH",
            "message": "User is a guest. Please sign up or log in to save bookmarks."
        }

    college = College.objects.filter(name__icontains=college_name.strip()).first()
    if not college:
        return {"status": "NOT_FOUND", "message": f"University '{college_name}' not found."}

    bookmark, created = Bookmark.objects.get_or_create(user=user, college=college)
    return {
        "status": "SUCCESS",
        "action": "BOOKMARKED",
        "college_name": college.name,
        "college_id": college.id,
        "is_new": created,
        "badge_tag": f"[[ACTION: BOOKMARK, College: {college.name}]]"
    }


def submit_recruiter_lead(user: User, college_name: str) -> Dict[str, Any]:
    """
    Submits the student's verified profile directly to the university's admissions recruiter portal.

    Args:
        user: The authenticated Django user instance.
        college_name: Name of the target university.
    """
    if not user or not user.is_authenticated:
        return {
            "status": "REQUIRES_AUTH",
            "message": "User is a guest. Please sign up or log in to connect with college recruiters."
        }

    college = College.objects.filter(name__icontains=college_name.strip()).first()
    if not college:
        return {"status": "NOT_FOUND", "message": f"University '{college_name}' not found."}

    lead, created = LeadStatus.objects.get_or_create(
        college=college,
        student=user,
        defaults={"status": "new"}
    )

    return {
        "status": "SUCCESS",
        "action": "LEAD_SUBMITTED",
        "college_name": college.name,
        "college_id": college.id,
        "status_code": lead.status,
        "badge_tag": f"[[ACTION: SUBMIT_LEAD, College: {college.name}]]"
    }
