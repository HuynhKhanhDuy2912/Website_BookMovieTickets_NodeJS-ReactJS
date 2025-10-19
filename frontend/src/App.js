import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/hello")
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h1>React – Backend CGV Connection Test</h1>
      <p>{message || "Đang kết nối backend..."}</p>
    </div>
  );
}

export default App;
