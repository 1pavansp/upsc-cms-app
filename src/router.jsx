import { createBrowserRouter } from 'react-router-dom';
import Home from './Components/Home';
import ArticlePage from './Components/ArticlePage';
import AdminLogin from './Components/AdminLogin';
import AdminDashboard from './Components/AdminDashboard';
import App from './App';

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
        path: "admin/login",
        element: <AdminLogin />
      },
      {
        path: "admin/dashboard",
        element: <AdminDashboard />
      }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});