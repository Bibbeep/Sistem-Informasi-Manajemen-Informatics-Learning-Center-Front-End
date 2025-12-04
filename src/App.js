import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./home/HomePage";
import Login from "./screens/login/Login";
import Register from "./screens/register/Regis";
import Dashboard from "./screens/dashboard/Dashboard";
import Course from "./screens/programs/Course";
import Seminar from "./screens/programs/Seminar";
import Workshop from "./screens/programs/Workshop";
import Competition from "./screens/programs/Competition";
import MateriPage from "./screens/materi/MateriPage";
import MateriDetailPage from "./screens/materi/components/MateriDetailPage";
import Forum from "./screens/forum/Forum";
import Payment from "./screens/payment/Payment";
import Contact from "./screens/contact/ContactUs";
import Certificate from "./screens/certificates/CertificatesPage";
import AdminDashboard from './admin/AdminDashboard';
import ManageUsers from './admin/ManageUsers';
import ManagePrograms from './admin/ManagePrograms';
import ManageMaterials from './admin/ManageMaterial';
import ManageCertificates from './admin/ManageCertificates';
import ManageForum from './admin/ManageForum';
import ManagePayment from './admin/ManagePayment';
import ManageContact from './admin/ManageContact';
import PrivateRoute from './screens/utils/PrivateRoute';
import PublicRoute from './screens/utils/PublicRoute';
import ResetPasswordPage from './screens/reset_password/ResetPassword';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />

        {/* Routes for logged-out users only */}
        <Route path="/" element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Private Routes for authenticated users */}
        <Route path="/" element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/programs" element={<Course />} />
          <Route path="/certificates" element={<Certificate />} />
          <Route path="/programs/course" element={<Course />} />
          <Route path="/programs/seminar" element={<Seminar />} />
          <Route path="/programs/workshop" element={<Workshop />} />
          <Route path="/materi" element={<MateriPage />} />
          <Route path="/materi/detail/:id" element={<MateriDetailPage />} />
          <Route path="/programs/competition" element={<Competition />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
        
        {/* Private Routes for Admin only */}
        <Route path="/admin" element={<PrivateRoute adminOnly={true} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/programs" element={<ManagePrograms />} />
          <Route path="/admin/materials" element={<ManageMaterials />} />
          <Route path="/admin/certificates" element={<ManageCertificates />} />
          <Route path="/admin/forum" element={<ManageForum />} />
          <Route path="/admin/payment" element={<ManagePayment />} />
          <Route path="/admin/contact" element={<ManageContact />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
