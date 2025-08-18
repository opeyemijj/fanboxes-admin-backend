export function splitUserName(fullName) {
  const firstSpaceIndex = fullName.indexOf(" ");

  if (firstSpaceIndex === -1) {
    return { firstName: fullName, lastName: "" };
  }

  return {
    firstName: fullName.slice(0, firstSpaceIndex),
    lastName: fullName.slice(firstSpaceIndex + 1),
  };
}
