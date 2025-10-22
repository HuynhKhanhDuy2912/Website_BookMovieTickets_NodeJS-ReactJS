import { useEffect, useState } from "react";
import api from "./api/axiosConfig";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/hello")
      .then(res => setMessage(res.data.message))
      .catch(err => console.error("Lỗi kết nối API:", err));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Kết nối Backend</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
