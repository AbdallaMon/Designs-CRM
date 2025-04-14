import gsap from "gsap";
import { isMobile } from "./function";

export function animateRegisterLeadCategoryItem({
  leadCategory,
  setIsAnimating,
  setIsCatAnimated,
}) {
  setIsAnimating(true);
  const removedElement = leadCategory === "DESIGN" ? "CONSULTATION" : "DESIGN";
  const mobile = isMobile();
  const tl = gsap.timeline();
  animateImageCardToFullWidthFullHeight(
    tl,
    "lead-card",
    removedElement,
    leadCategory,
    "shadow-lead-card"
  );
  tl.fromTo(
    ".logo",
    {
      marginLeft: mobile ? -20 : -24,
    },
    {
      marginLeft: 10,
    },
    "<"
  );
  tl.fromTo(
    ".reverse-button",
    {
      x: -60,
    },
    {
      display: "flex",
      x: 5,
    },
    "<"
  );

  tl.fromTo(
    ".location",
    {
      opacity: 0,
      y: 50,
    },
    {
      opacity: 1,
      y: 0,
    },
    "<"
  );
  tl.fromTo(
    ".design-cards-container > h4",
    {
      opacity: 0,
      y: -50,
    },
    {
      opacity: 1,
      y: 0,
    },
    "<"
  );

  tl.then(() => {
    console.log("so?");
    setIsAnimating(false);
    setIsCatAnimated(true);
  });
}

export function animateImageCardToFullWidthFullHeight(
  tl,
  itemClass,
  removeElementClass,
  animatedElementClass,
  shadowClass = "shadow-lead-card"
) {
  // const removedElement = document.querySelector(`.${removeElementClass}`);
  const allItems = document.querySelectorAll(
    `.${itemClass}:not(.${animatedElementClass})`
  );
  const animatedElement = document.querySelector(`.${animatedElementClass}`);
  const animatedShadowElement = animatedElement.querySelector(
    `.${shadowClass}`
  );
  const { top, left, height, width } = animatedElement.getBoundingClientRect();
  const removeShadowElements = document.querySelectorAll(
    `.${itemClass}:not(.${animatedElementClass}) .${shadowClass}`
  );
  const centerX = window.innerWidth / 2 - width / 2;
  const centerY = window.innerHeight / 2 - height / 2;
  tl.set(`.${itemClass} .${shadowClass}`, {
    boxShadow: "none",
    borderRadius: "0px",
    position: "fixed",
    width: width,
    height: height,
  });
  tl.set(animatedShadowElement, {
    left: `${left}px`,
    top: `${top}px`,
  });
  allItems.forEach((removedElement) => {
    const { left: l, top: t } = removedElement.getBoundingClientRect();
    const removeShadowElement = removedElement.querySelector(`.${shadowClass}`);
    tl.set(removeShadowElement, {
      left: `${l}px`,
      top: `${t}px`,
    });
  });
  tl.set(removeShadowElements, {
    x: -100,
    opacity: 0,
    duration: 0.8,
    ease: "power3.inOut", // Smoother easing function
  });
  tl.set(
    animatedShadowElement,

    {
      top: `${centerY}px`,
      left: `${centerX}px`,
      height: `${height}px`,
      width: `${width}px`,
      duration: 0.8,
      ease: "power3.inOut",
      margin: 0,
    },
    "<"
  );
  const leadText = animatedElement.querySelector("h4");
  tl.set(leadText, {
    top: "80px",
    left: "50%",
    transform: "translate(-50%,0%)",
  });
  tl.set(animatedShadowElement, {
    top: 0,
    left: 0,
    height: "100vh",
    width: "100vw",
    duration: 0.8,
    ease: "power3.out",
  });
  tl.set(leadText, {
    opacity: 0,
    top: 0,
  });
}
