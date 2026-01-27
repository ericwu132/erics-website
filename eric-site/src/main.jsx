import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { refreshFadeIn } from "./main.js";
import Experiences from "./Experiences.jsx";

const experiencesRoot = document.getElementById("experiencesRoot");
if (experiencesRoot) {
  createRoot(experiencesRoot).render(<Experiences />);
  requestAnimationFrame(() => refreshFadeIn());
}
