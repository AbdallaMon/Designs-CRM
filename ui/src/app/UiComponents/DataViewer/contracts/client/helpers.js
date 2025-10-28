export const contractSessionStatusFlow = {
  INITIAL: {
    next: "SIGNING",
    back: null,
  },
  SIGNING: {
    next: "REGISTERED",
    back: "INITIAL",
  },
  REGISTERED: {
    next: null,
    back: "SIGNING",
  },
};
