export type OnboardingSlideItem = {
  id: string;
  image: any;
};

export const onboardingSlides: OnboardingSlideItem[] = [
  {
    id: "project-management",
    image: require("../../../../assets/onboarding/onboard1.png"),
  },
  {
    id: "team-coordination",
    image: require("../../../../assets/onboarding/onboard2.png"),
  },
  {
    id: "finance-approvals",
    image: require("../../../../assets/onboarding/onboard3.png"),
  },
];
