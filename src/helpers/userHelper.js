import jwt from "jsonwebtoken";

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

export function getUserFromToken(req) {
  try {
    const authHeader = req?.headers?.authorization;

    if (!authHeader) return null;

    // Check if it starts with 'Bearer '
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader; // use the whole string if no 'Bearer '

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return decoded;
  } catch (error) {
    console.error("Invalid token:", error.message);
    return null;
  }
}

export function checkIsAdmin(roleName) {
  const roleType = roleName?.toLowerCase();
  if (
    !["user", "vendor", "influencer", "", null, undefined].includes(roleType)
  ) {
    return true;
  } else {
    return false;
  }
}
