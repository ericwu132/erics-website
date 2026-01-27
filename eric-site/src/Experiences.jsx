import { useLayoutEffect, useRef, useState } from "react";

const experiences = [
  {
    id: "wato",
    logo: "/wato.jpg",
    company: "WATonomous",
    role: "software engineering member",
    time: "Jan 2026 - present",
    body:
      "currently making a robot type on a keyboard. Using ROS2 and NVIDIA jetson",
    body2:
      "",
    image: "/asd.jpg",
  },
  {
    id: "aerial",
    logo: "/uwfe.png",
    company: "University of Waterloo Formula Electric",
    role: "mechanical engineering member",
    time: "Sept 2025 - present",
    body:
      "manufactured for the suspension subteam, making things like spacers, top hats, and control arm plugs.",
    body2:
      "experienced in using lathes and mills.",
    image: "/parts.jpg",
    imagePosition: "40% 80%",
  },
  {
    id: "churchill",
    logo: "/churchill.jpg",
    company: "Churchill Robotics",
    role: "mechanical lead",
    time: "Oct 2023 - May 2025",
    body:
      "built world class vex robots, won alberta provincials, and competed at worlds.",
    body2:
      "focused on CAD with solidworks + fusion360, and led mechanical design",
    image: "/robotphoto.jpg",
  },
];

export default function Experiences() {
  const [openId, setOpenId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [maxHeight, setMaxHeight] = useState(0);
  const contentRef = useRef(null);
  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    if (isOpen) {
      setMaxHeight(contentRef.current.scrollHeight);
    } else {
      setMaxHeight(0);
    }
  }, [openId, isOpen]);

  function handleOpen(id) {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    openTimerRef.current = setTimeout(() => {
      if (openId !== id) setOpenId(id);
      if (!isOpen) setIsOpen(true);
      openTimerRef.current = null;
    }, 140);
  }

  function handleClose() {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, 50);
  }

  function handleTransitionEnd(event) {
    if (event.propertyName !== "max-height") return;
    if (!isOpen) {
      setOpenId(null);
    }
  }

  return (
    <>
      <div className="experiences__header">
        <h2 className="experiences__title">where i've been</h2>
      </div>

      <div
        className="experiences__wrap"
        onMouseEnter={() => {
          if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }
        }}
        onMouseLeave={handleClose}
        onFocusOut={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) handleClose();
        }}
      >
        <div className="experiences__list">
          {experiences.map((exp) => {
            const isActive = openId === exp.id && isOpen;
            return (
              <div className="exp-block" key={exp.id}>
                <button
                  className={`exp-row ${isActive ? "is-active" : ""}`}
                  type="button"
                  onMouseEnter={() => handleOpen(exp.id)}
                  onFocus={() => handleOpen(exp.id)}
                  onClick={() => handleOpen(exp.id)}
                >
                  <span className="exp-row__logo">
                    <img src={exp.logo} alt={`${exp.company} logo`} />
                  </span>
                  <span className="exp-row__main">
                    <span className="exp-row__company">{exp.company}</span>
                    <span className="exp-row__role">{exp.role}</span>
                  </span>
                  <span className="exp-row__line" aria-hidden="true"></span>
                  <span className="exp-row__time">{exp.time}</span>
                </button>

                {openId === exp.id ? (
                  <div
                    className={`exp-detail ${isOpen ? "is-open" : ""}`}
                    style={{ maxHeight: `${maxHeight}px` }}
                    onTransitionEnd={handleTransitionEnd}
                    onMouseEnter={() => {
                      if (closeTimerRef.current) {
                        clearTimeout(closeTimerRef.current);
                        closeTimerRef.current = null;
                      }
                    }}
                  >
                    <div ref={contentRef} className="exp-detail__inner">
                      <div className="exp-detail__text">
                        <h3 className="exp-detail__title">what i did</h3>
                        <p>{exp.body}</p>
                        <p>{exp.body2}</p>
                      </div>
                      <div className="exp-detail__media">
                      <div className="exp-detail__image">
                        <img
                          src={exp.image}
                          alt={`${exp.company} preview`}
                          style={{
                            objectPosition: exp.imagePosition || "center",
                          }}
                        />
                      </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
