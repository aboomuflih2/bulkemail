import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EmailSender from "@/pages/EmailSender";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EmailSender />} />
      </Routes>
    </Router>
  );
}
