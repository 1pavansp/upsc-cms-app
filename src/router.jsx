import { createBrowserRouter } from 'react-router-dom';
import Home from './Components/Home';
import ArticlePage from './Components/ArticlePage';
import AdminLogin from './Components/AdminLogin';
import AdminDashboard from './Components/AdminDashboard';
import ProtectedRoute from './Components/ProtectedRoute';
import App from './App';
import GsArticlesPage from './Components/GsArticlesPage';
import SubjectArticlesPage from './Components/SubjectArticlesPage';
import RecentArticlesPage from './Components/RecentArticlesPage';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "article/:articleId",
        element: <ArticlePage />
      },
      {
        path: "current-affairs/:articleId",
        element: <ArticlePage />
      },
      {
        path: "tags/:tagId",
        element: <Home />
      },
      {
        path: "gs/:tagId",
        element: <GsArticlesPage />
      },
      {
        path: "gs/:tagId/:subjectId",
        element: <SubjectArticlesPage />
      },
      {
        path: "recent-articles",
        element: <RecentArticlesPage />
      },
      {
        path: "admin/login",
        element: <AdminLogin />
      },
      {
        path: "admin/dashboard",
        element: (
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        )
      }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});
