import Cookies from 'js-cookie';

const COOKIE_NAME = 'userSession';

export const setUserSession = (user: { email: string; id: string; role: string }) => {
  const cookieValue = JSON.stringify(user);
  Cookies.set(COOKIE_NAME, cookieValue, { expires: 7 }); // Expires in 7 days
};

export const getUserSession = () => {
  const cookieValue = Cookies.get(COOKIE_NAME);
  return cookieValue ? JSON.parse(cookieValue) : null;
};

export const clearUserSession = () => {
  Cookies.remove(COOKIE_NAME);
};
