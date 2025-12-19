import "./style.css";

const linklist = document.getElementById("linklist");
const side = document.getElementById("side");
const topbarLinks = document.getElementById("topbarLinks");

// Create a scroll trigger point (“sentinel”)
const sentinel = document.createElement("div");
sentinel.style.position = "absolute";
sentinel.style.top = "240px"; // adjust when you want the dock to trigger
sentinel.style.left = "0";
sentinel.style.width = "1px";
sentinel.style.height = "1px";
document.body.prepend(sentinel);

const dock = (shouldDock) => {
  document.body.classList.toggle("isDocked", shouldDock);
  if (shouldDock) {
    topbarLinks.appendChild(linklist); // move links into header
  } else {
    side.appendChild(linklist);        // move links back to sidebar
  }
};

const io = new IntersectionObserver(([entry]) => {
  dock(!entry.isIntersecting);
});

io.observe(sentinel);
