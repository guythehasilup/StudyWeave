export const he = {
  server: {
    apiName: 'ממשק השרת של StudyWeave',
    healthy: 'תקין',
  },
  auth: {
    invalidCredentials: 'שם המשתמש או הסיסמה שגויים.',
    authenticationRequired: 'נדרשת התחברות כדי לבצע פעולה זו.',
    usernameTaken: 'שם המשתמש כבר נמצא בשימוש.',
  },
  ai: {
    requestNotFound: 'בקשת הבינה המלאכותית לא נמצאה.',
    clientRequestConflict: 'מזהה הבקשה כבר שייך להודעה אחרת.',
    failed: 'לא הצלחנו לקבל תשובה. נסו שוב בבקשה חדשה.',
    uncertain: 'לא ניתן לאשר אם הבקשה הושלמה. הבקשה לא תישלח שוב אוטומטית.',
  },
  validation: {
    invalidParams: 'הפרמטרים שנשלחו אינם תקינים.',
    aiRequestIdInvalid: 'מזהה הבקשה חייב להיות UUID תקין.',
    aiMessageRequired: 'יש להזין הודעה.',
    aiMessageLength: 'אורך ההודעה חייב להיות עד 8,000 תווים.',
    invalidBody: 'הנתונים שנשלחו אינם תקינים.',
    usernameRequired: 'יש להזין שם משתמש.',
    usernameInvalid:
      'שם המשתמש חייב להכיל 3 עד 50 תווים: אותיות, ספרות, נקודות, קווים תחתונים או מקפים בלבד.',
    passwordRequired: 'יש להזין סיסמה.',
    passwordLength: 'הסיסמה חייבת להכיל בין 8 ל־128 תווים.',
    displayNameRequired: 'יש להזין שם תצוגה.',
    displayNameLength: 'שם התצוגה חייב להכיל עד 100 תווים.',
  },
  errors: {
    notFound: 'המשאב המבוקש לא נמצא.',
    internal: 'אירעה שגיאה פנימית. נסו שוב מאוחר יותר.',
  },
} as const;
