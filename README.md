# College Tracker Application

## Project Description

This project is a web application designed to help prospective students looking to enroll in higher education discover and manage information about colleges. It allows users to browse through a database of colleges, bookmark their favorites, and receive personalized recommendations based on their saved preferences and get connected and engage with other prospective students. The application includes features such as user authentication, college data management, dynamic visualisations, and user engagement features. It aims to provide a user-friendly and efficient way for prospective students or anyone interested to explore higher education options. The project uses actual comprehensive data from the College Board database, ensuring that the information shown is accurate and up to date.

## Features

*   **User Authentication:**
    *   Secure user registration and login system using JWT tokens.
    *   Profile management for logged-in users, including viewing and updating their information.
*   **College Data Management:**
    *   Ability to upload college data from a CSV file.
    *   Display detailed information about each college, including acceptance rates, SAT scores, cost of attendance, tuition fees, and website links.
    *   Search functionality to quickly find colleges by name.
    *   View college location using a built in map.
    *   **Infinite Scroll:** The main landing page features infinite scroll to load more colleges as the user scrolls down, enhancing the browsing experience without loading all data at once.
*   **Bookmarking:**
    *   Users can bookmark colleges to save them for later.
    *   A dedicated bookmarks page displays all saved colleges.
*   **Recommendations:**
    *   Personalized recommendations are provided based on a user's bookmarked colleges, considering factors such as state, admission rates, SAT scores, and cost of attendance.
    *   Recommended colleges are displayed using a dynamic slider.
*   **Dynamic Visualisations:**
    *  A map displays the location of the college.
*   **Social Interactions:**
   * **Friend Requests:** Users can send friend requests to other users and accept or reject requests. The friend requests and user friend status is displayed on their profiles and the user is notified when they have new friend requests.
    * Users can like and comment on blog posts for interaction. The posts and comments have the feature to edit and delete as well.
    * Users can view a trending page which displays posts made by other users.
*   **User Profiles:**
    * Users can upload profile pictures, add a bio and update their personal information.
*   **Interactive Elements:**
   * Dynamic loading and error states are used to make the app more reactive to users' actions.
   * Users can like and comment on blog posts for interaction.
   * Users can upload posts with and without images.

## Distinctiveness and Complexity

This project demonstrates distinctiveness and complexity in the following ways:

*   **Full-Stack Implementation:** It encompasses both backend (Django REST Framework, Python) and frontend (React) development, showcasing skills in full-stack web development.
*   **Personalized Recommendations:** The recommendation engine goes beyond simple filtering. It calculates similarity scores based on multiple factors, including state, SAT scores, admission rates, cost of attendance, providing tailored results. It iterates through all the bookmarked colleges, and then through all the colleges that are filtered by the state of those bookmarked colleges.
*   **Dynamic Visualisations:** The use of `react-leaflet` for a map, and a responsive slider showcases the use of advanced React libraries to create a dynamic and visually appealing user interface.
* **Complex Relationships**: The backend code implements a full system for user authentication, posting and commenting, following other users, and managing friend requests showcasing an understanding of complex relationships in a database.
*   **Error Handling and Authentication:** The project demonstrates robust error handling, input validation, and the use of JWT for secure API access, highlighting attention to best practices.
*   **Responsive UI**: The use of Tailwind CSS and responsive design make sure that the app looks and functions well regardless of the screen size.
*   **Image Uploading**: The user can upload images with the posts and upload their profile picture to make the app visually more appealing.
*   **API Filtering:** The API uses filtering to retrieve specific datasets based on personal information.
*   **Infinite Scrolling:** The landing page uses infinite scrolling, which implements an efficient and modern method of loading colleges in the frontend.

## File Structure

Here’s a breakdown of the main files and their contents:

**Backend (Django/Python)**
*   `collegetracker/models.py`: Defines the database models for users, colleges, posts, comments, bookmarks, friendships, likes and replies.
*   `collegetracker/serializers.py`: Defines serializers for converting complex objects (like database models) to JSON and vice versa, for use in the API.
*   `collegetracker/views.py`: Contains all of the Django REST Framework API views for handling requests, such as user registration, login, college listing, college detail, posts, and comments, and bookmark management.
*   `collegetracker/urls.py`: Defines the URL patterns for the API endpoints.
*   `collegetracker/admin.py`: Configures the Django admin interface for managing the application’s data.
*   `manage.py`: The main file for running Django commands.

**Frontend (React/JavaScript)**

*   `src/App.js`: The root component that sets up the application's routing.
*   `src/components`: Contains various reusable React components such as `College`, `ProtectedRoute`, and `NotFound`.
*   `src/pages`: Contains components that represent different pages of the app, like `Bookmarks`, `Home`, `Login`, `Register`, and `CollegeDetail`, `Profile`, and `Trending`.
*   `src/UserProvider/UserProvider.js`: A React context provider for managing user authentication state.
*  `src/shared.js`: Shared variables like the `baseUrl` of the API.
*   `src/constants.js`: Contains paths for static assets and images.
*   `public/index.html`: The HTML template for the application.

**3. Requirements.txt**

pandas
djangorestframework
djangorestframework-simplejwt
graphene-django
python-dotenv
Pillow
chartjs
react-chartjs-2
requests
whitenoise
geopy
leaflet
react-leaflet

**How to Run the Application**

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/me50/bpaksoy/tree/web50/projects/2020/x/capstone
    cd [your-repo-directory]
    ```

2.  **Backend Setup:**

    ```bash
    # Navigate to the backend folder, and create a virtual environment
     cd backend

    # Create and activate the virtual environment (if using venv)
    python3 -m venv venv
    source venv/bin/activate

    # Install requirements
    pip install -r requirements.txt

    # Apply database migrations
    python manage.py makemigrations
    python manage.py migrate

    # Run the development server
    python manage.py runserver
    ```

3.  **Frontend Setup:**

    ```bash
    # Navigate to the frontend folder
    cd frontend

    # Install dependencies
    npm install

    # Start the React app
    npm start
    ```

4.  **Access the Application:**
    *   Open your web browser and navigate to `http://localhost:3000`.
    *   The backend API will be running on `http://127.0.0.1:8000`.

**Additional Information**
* To run this application, your API and frontend need to be running on the correct ports.
* You will also need to have an admin user created in the database.
* The main landing page implements infinite scroll, which does not load all colleges on the first request, and only loads them as the user scrolls.

**College Board Data**
This project uses actual comprehensive data from the College Board database, ensuring that the information shown is accurate and up to date.