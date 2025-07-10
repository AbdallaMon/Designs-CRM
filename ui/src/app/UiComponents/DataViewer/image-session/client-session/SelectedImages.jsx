"use client";

import { gsap } from "gsap";

import { ClientSelectedImages } from "./ClientSelectedImages";
import { useEffect, useRef } from "react";

export function SelectedImages({
  session,
  handleBack,
  disabled,
  nextStatus,
  handleNext,
  loading,
}) {
  const cardsRef = useRef([]);
  const titleRef = useRef();
  // useEffect(() => {
  //   if (session && !loading) {
  //     const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  //     gsap.set(cardsRef.current, {
  //       opacity: 0,
  //       y: 60,
  //       scale: 0.8,
  //       rotationX: 15,
  //       filter: "blur(8px) brightness(0.7)",
  //       transformOrigin: "center bottom",
  //     });

  //     tl.fromTo(
  //       titleRef.current,
  //       {
  //         opacity: 0,
  //         y: -30,
  //         scale: 0.9,
  //         filter: "blur(3px)",
  //       },
  //       {
  //         opacity: 1,
  //         y: 0,
  //         scale: 1,
  //         filter: "blur(0px)",
  //         duration: 0.5,
  //         ease: "back.out(1.7)",
  //       }
  //     );

  //     // Modern card entrance with layered effects
  //     tl.to(
  //       cardsRef.current,
  //       {
  //         opacity: 1,
  //         y: 0,
  //         scale: 1,
  //         rotationX: 0,
  //         filter: "blur(0px) brightness(1)",
  //         duration: 0.6,
  //         stagger: {
  //           amount: 0.2,
  //           from: "start",
  //           ease: "power2.out",
  //         },
  //         ease: "back.out(1.2)",
  //       },
  //       "-=0.2"
  //     );

  //     return () => {
  //       tl.kill();
  //     };
  //   }
  // }, [session, loading]);
  return (
    <>
      <ClientSelectedImages
        cardsRef={cardsRef}
        disabled={disabled}
        handleBack={handleBack}
        handleNext={handleNext}
        loading={loading}
        nextStatus={nextStatus}
        session={session}
        titleRef={titleRef}
        canDelete={true}
      />
    </>
  );
}
