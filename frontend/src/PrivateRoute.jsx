// PrivateRoute.jsx
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default PrivateRoute;