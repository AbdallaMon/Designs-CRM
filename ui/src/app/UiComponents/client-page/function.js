import { gsap } from "gsap";

export function initialAnimation(setIsAnimating, extraFunction) {
  setIsAnimating(true);
  gsap.fromTo(
    ".category-title",
    {
      opacity: 0,
      y: 50,
    },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out",
    }
  );
  const tl = gsap.timeline();
  tl.fromTo(
    ".lead-card:nth-child(odd)",
    {
      opacity: 0,
      x: -50,
    },
    {
      x: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out",
    }
  ).fromTo(
    ".lead-card:nth-child(even)",
    {
      opacity: 0,
      x: 50,
    },
    {
      x: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out",
    },
    "<"
  );
  tl.set(".lead-card", {
    clearProps: "transform",
  }).then(() => {
    setIsAnimating(false);
    if (extraFunction) {
      extraFunction();
    }
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
  tl.fromTo(
    removeShadowElements,
    { x: 0, opacity: 1 },
    {
      x: -100,
      opacity: 0,
      duration: 0.8,
      ease: "power3.inOut", // Smoother easing function
    }
  );
  tl.fromTo(
    animatedShadowElement,
    {
      top: `${top}px`,
      left: `${left}px`,
      height: `${height}px`,
      width: `${width}px`,
    },
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
  tl.to(leadText, {
    top: "80px",
    left: "50%",
    transform: "translate(-50%,0%)",
  });
  tl.to(animatedShadowElement, {
    top: 0,
    left: 0,
    height: "100vh",
    width: "100vw",
    duration: 0.8,
    ease: "power3.out",
  });
  tl.to(leadText, {
    opacity: 0,
    top: 0,
  });
}

export function animateLeadCategoryItem({
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

  if (leadCategory === "CONSULTATION") {
    animateLeadItem(tl);
  } else {
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
  }
  tl.then(() => {
    console.log("so?");
    setIsAnimating(false);
    setIsCatAnimated(true);
  });
}
function animateLeadItem(tl) {
  tl.fromTo(
    ".lead-item",
    { y: 50, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      stagger: 0.1,
      ease: "power3.out",
    },
    "<"
  );
  tl.fromTo(
    ".item-title",
    {
      opacity: 0,
      y: -50,
    },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power3.out",
    },
    "<"
  );
}
export function animateFormPage({ setIsAnimating, setIsItemAnimated }) {
  setIsAnimating(true);
  const tl = gsap.timeline();
  tl.fromTo(
    ".form-page",
    {
      top: "100%", // Start from off-screen
      opacity: 0, // Invisible initially
    },
    {
      top: 0, // Move to its final position
      opacity: 1, // Fade in
      display: "block", // Ensure it becomes visible
      duration: 0.8, // Smooth duration
      ease: "power3.out", // Smooth easing
    }
  );
  tl.fromTo(
    ".final-selection-form",
    {
      opacity: 0,
      scale: 0.9,
    },
    {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: "back.out(1.7)",
    }
  ).then(() => {
    setIsAnimating(false);
    setIsItemAnimated(true);
  });
}
function removeLeadItem(tl) {
  tl.fromTo(
    ".item-title",
    {
      opacity: 1,
      y: 0,
    },
    {
      opacity: 0,
      y: 50,
      duration: 0.6,
      ease: "power3.inOut",
    }
  );
  tl.to(".lead-item", {
    y: 50,
    opacity: 0,
    stagger: 0.1,
    duration: 0.6,
    ease: "power3.inOut",
  });
}

function disAnimateLeadForm({
  tl,
  setLeadItem,
  setAnimateLeadItem,
  setIsItemAnimated,
  setIsReversing,
}) {
  tl.fromTo(
    ".form-page",
    {
      top: 0,
      opacity: 1,
      display: "block",
    },
    {
      top: "100%",
      opacity: 0,
      display: "none",
      duration: 0.8,
      ease: "power3.inOut",
    }
  ).then(() => {
    setLeadItem("");
    setAnimateLeadItem("");
    setIsItemAnimated(false);
    setIsReversing(false);
  });
}
export function animateLocationItem({
  leadCategory,
  location,
  setIsAnimating,
  setIsLocationAnimated,
  translate,
}) {
  setIsAnimating(true);
  const tl = gsap.timeline();
  animateLocation({ location, tl, leadCategory, translate });
  animateLeadItem(tl);

  tl.then(() => {
    setIsAnimating(false);
    setIsLocationAnimated(true);
  });
}
export function isMobile() {
  const mediaQuery = `(max-width: ${900 - 1}px)`;
  return window.matchMedia(mediaQuery).matches;
}
function animateLocation({ location, tl, leadCategory, translate }) {
  const locationQuestionTitle = document.querySelector(".design-title");
  const animatedElement = document.querySelector(`.${location}`);
  const locationTitle = animatedElement.querySelector("h4");
  const leadTitle = document.querySelector(`.${leadCategory} h4`);
  const clonedTitle = locationTitle.cloneNode(true);
  const rect = locationTitle.getBoundingClientRect();
  const leadTittleRect = leadTitle.getBoundingClientRect();
  clonedTitle.style.position = "fixed";
  clonedTitle.classList.add("cloned-location-title");
  clonedTitle.style.width = `${rect.width}px`;
  clonedTitle.style.height = `${rect.height}px`;
  clonedTitle.style.margin = "0";
  clonedTitle.style.transform = "none";
  clonedTitle.style.zIndex = 16;
  document.body.appendChild(clonedTitle);
  tl.set(clonedTitle, {
    left: rect.left,
    top: rect.top,
  });
  tl.fromTo(
    locationQuestionTitle,
    {
      y: 0,
      opacity: 1,
    },
    {
      y: -100,
      opacity: 0,
      duration: 0.8,
      ease: "power3.inOut",
    }
  );
  tl.set(locationTitle, {
    opacity: 0,
  });
  // const space=!isMobile()&&clonedTitle.textContent!=="Inside UAE"?-2:isMobile()&&clonedTitle.textContent==="Inside UAE"?-12:!isMobile()&&clonedTitle.textContent!=="Out side UAE"?-5:isMobile()&&clonedTitle.textContent!=="Out side UAE"?-20:isMobile()?7:15
  tl.fromTo(
    clonedTitle,
    {
      top: rect.top,
      left: rect.left,
    },
    {
      top: leadTittleRect.top,
      left: "50%",
      duration: 1.2,
      ease: "power3.inOut",
      x: "-50%",
    }
  );
  tl.to(leadTitle, { x: 100 }, "<");
  tl.set(clonedTitle, {
    opacity: 0,
  });
  tl.fromTo(
    ".location",
    {
      opacity: 1,
      y: 0,
    },
    { opacity: 0, y: 100, duration: 0.8, zIndex: -15, ease: "power3.inOut" },
    "<-0.5"
  );
}
function reverseLocation({ tl, location, leadCategory }) {
  const animatedElement = document.querySelector(`.${location}`);
  const locationTitle = animatedElement.querySelector("h4");
  const leadTitle = document.querySelector(`.${leadCategory} h4`);

  const clonedTitle = document.querySelector(".cloned-location-title");
  const locationQuestionTitle = document.querySelector(".design-title");
  const leadTittleRect = leadTitle.getBoundingClientRect();
  const clonedTitleRect = clonedTitle.getBoundingClientRect();
  tl.fromTo(
    locationQuestionTitle,
    {
      y: -100,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.inOut",
    }
  );
  tl.fromTo(
    ".location",
    {
      opacity: 0,
      y: 100,
    },
    { opacity: 1, y: 0, duration: 0.8, zIndex: 15, ease: "power3.inOut" },
    "<"
  );
  const rect = locationTitle.getBoundingClientRect();
  tl.to(leadTitle, { x: 0 }, "<");
  tl.set(
    clonedTitle,
    {
      opacity: 1,
    },
    "<"
  );
  tl.fromTo(
    clonedTitle,
    {
      top: leadTittleRect.top,
      left: clonedTitleRect.left + clonedTitleRect.width / 2,
    },
    {
      top: rect.top - 100,
      left: rect.left,
      x: 0,
      duration: 1.2,
      ease: "power3.inOut",
      onComplete: () => {
        clonedTitle.remove();
      },
    },
    "<"
  );
  tl.set(locationTitle, {
    opacity: 1,
  });
  tl.then(() => {
    clonedTitle.remove();
  });
}
export function reverseAnimation({
  location,
  isLocationAnimated,
  setLocation,
  setAnimateLocation,
  setIsLocationAnimated,
  leadItem,
  isItemAnimated,
  isReversing,
  isAnimating,
  setIsReversing,
  setLeadItem,
  setAnimateLeadItem,
  setIsItemAnimated,
  leadCategory,
  isCatAnimated,
  setLeadCategory,
  setAnimateLeadType,
  setIsCatAnimated,
}) {
  if (leadItem && isItemAnimated && !isReversing && !isAnimating) {
    setIsReversing(true);
    const tl = gsap.timeline();
    disAnimateLeadForm({
      tl,
      setLeadItem,
      setIsReversing,
      setAnimateLeadItem,
      setIsItemAnimated,
    });
  } else if (location && isLocationAnimated && !isAnimating && !isReversing) {
    setIsReversing(true);
    const tl = gsap.timeline();
    removeLeadItem(tl);
    reverseLocation({ tl, location, leadCategory });
    tl.then(() => {
      setAnimateLocation("");
      setIsLocationAnimated(false);
      setIsReversing(false);
      setLocation("");
    });
  } else if (leadCategory && isCatAnimated && !isReversing && !isAnimating) {
    window.location.href = "https://eng.ahmed.dreamstudiio.com/";
    return;
    setIsReversing(true);
    const tl = gsap.timeline();
    const allItems = document.querySelectorAll(
      `.lead-card:not(.${leadCategory})`
    );
    const removedElements = document.querySelectorAll(
      `.lead-card:not(.${leadCategory}) .shadow-lead-card`
    );
    const mobile = isMobile();
    const leadElement = document.querySelector(`.${leadCategory}`);
    const {
      top: t,
      left: l,
      height: h,
      width: w,
    } = leadElement.getBoundingClientRect();
    const shadowLead = leadElement.querySelector(".shadow-lead-card");
    const leadText = leadElement.querySelector("h4");
    tl.to(
      leadText,
      {
        opacity: 1,
        top: "80px",
      },
      "<"
    );
    if (leadCategory === "CONSULTATION") {
      removeLeadItem(tl);
    } else {
      tl.fromTo(
        ".location",
        {
          opacity: 1,
          y: 0,
        },
        {
          opacity: 0,
          y: 50,
        }
      );
      tl.fromTo(
        ".design-cards-container > h4",
        {
          opacity: 1,
          y: 0,
        },
        {
          opacity: 0,
          y: -50,
        },
        "<"
      );
    }
    tl.to(shadowLead, {
      top: `${t}px`,
      left: `${l}px`,
      height: `${h}px`,
      width: `${w}px`,
      borderRadius: "12px",
      duration: 0.8,
      ease: "power3.inOut",
    })
      .fromTo(
        ".reverse-button",
        {
          x: 5,
        },
        {
          display: "none",
          x: -50,
        },
        "<"
      )
      .fromTo(
        ".logo",
        {
          marginLeft: 10,
        },
        {
          marginLeft: mobile ? -20 : -24,
        },
        "<"
      );
    allItems.forEach((removedElement) => {
      const { top, left, height, width } =
        removedElement.getBoundingClientRect();
      const removeShadowElement =
        removedElement.querySelector(`.shadow-lead-card`);
      tl.set(removeShadowElement, {
        top: `${top}px`,
        left: `${left}px`,
        height: `${height}px`,
        width: `${width}px`,
      });
    });

    tl.set(`.shadow-lead-card`, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
    });

    tl.to(removedElements, {
      x: 0,
      borderRadius: "12px",
      opacity: 1,
      duration: 0.8,
      ease: "power3.inOut",
    });
    tl.to(
      leadText,
      {
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
      },
      "<"
    );
    tl.fromTo(
      ".category-title",
      {
        opacity: 0,
        y: 50,
        duration: 0.6,
        ease: "power3.inOut",
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.inOut",
      },
      "<"
    ).then(() => {
      setLeadCategory("");
      setAnimateLeadType("");
      setIsCatAnimated(false);
      setIsReversing(false);
      window.sessionStorage.removeItem("animated");
    });
  }
}
