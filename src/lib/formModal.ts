/** Any CTA on the page can open the registration popup by firing this. */
export const OPEN_FORM_EVENT = "funnel:open-form";

export const openRegistrationForm = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_FORM_EVENT));
};
