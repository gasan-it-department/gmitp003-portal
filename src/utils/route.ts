export const levelPath = (depart: string) => {
  if (depart === "hr") {
    return "/human-resources/home";
  } else if (depart === "hr") {
    return "/human-resources";
  } else if (depart === "om") {
    return "/human-resources";
  } else if (depart === "io") {
    return "/human-resources";
  } else if (depart === "tre") {
    return "/human-resources";
  }
};
export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};
