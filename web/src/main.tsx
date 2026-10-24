import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { daMoKhoa } from "./lib/khoa";
import { ManHinhKhoa } from "./ui/ManHinhKhoa";
import "./styles.css";

function Goc() {
  const [mo, setMo] = useState(daMoKhoa);
  return mo ? <App /> : <ManHinhKhoa onMo={() => setMo(true)} />;
}

createRoot(document.getElementById("goc")!).render(
  <StrictMode>
    <Goc />
  </StrictMode>,
);
