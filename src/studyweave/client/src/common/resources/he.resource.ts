export const he = {
  common: {
    productName: 'המכלול',
    productDescription: 'מרחב אחד לכל השאלות, התרגולים ותהליכי הלמידה שלך.',
  },
  form: {
    showPassword: 'הצגת הסיסמה',
    hidePassword: 'הסתרת הסיסמה',
  },
  errors: {
    authFormProviderMissing: 'יש להשתמש בטופס ההתחברות בתוך ספק טופסי האימות.',
    routerProviderMissing: 'יש להשתמש בניווט בתוך ספק הניווט.',
  },
  auth: {
    requestFailed: 'לא ניתן להשלים את הפעולה. נסו שוב.',
    invalidResponse: 'התקבלה תשובה לא תקינה מהשרת.',
  },
  login: {
    heading: 'התחברות',
    description: 'הזינו את פרטי החשבון כדי להמשיך למרחב הלמידה.',
    usernameLabel: 'שם משתמש',
    passwordLabel: 'סיסמה',
    submit: 'התחברות',
    submitting: 'מתחברים…',
    error: 'שם המשתמש או הסיסמה שגויים.',
    success: 'ההתחברות הושלמה בהצלחה.',
    noAccount: 'עדיין אין לך חשבון?',
    registerLink: 'יצירת חשבון',
  },
  register: {
    heading: 'יצירת חשבון',
    description: 'בחרו שם משתמש וסיסמה כדי להתחיל ללמוד במכלול.',
    displayNameLabel: 'שם תצוגה',
    usernameLabel: 'שם משתמש',
    passwordLabel: 'סיסמה',
    submit: 'הרשמה',
    submitting: 'יוצרים חשבון…',
    error: 'לא ניתן ליצור את החשבון. בדקו את הפרטים ונסו שוב.',
    success: 'החשבון נוצר בהצלחה.',
    hasAccount: 'כבר יש לך חשבון?',
    loginLink: 'להתחברות',
  },
  notFound: {
    heading: 'העמוד לא נמצא',
    description: 'הכתובת שביקשת אינה קיימת או שהעמוד הועבר למקום אחר.',
    action: 'חזרה להתחברות',
    loginLink: 'מעבר לעמוד ההתחברות',
  },
  validation: {
    displayNameRequired: 'יש להזין שם תצוגה.',
    displayNameLength: 'שם התצוגה חייב להכיל עד 100 תווים.',
    usernameRequired: 'יש להזין שם משתמש.',
    usernameInvalid:
      'שם המשתמש חייב להכיל 3 עד 50 תווים: אותיות, ספרות, נקודות, קווים תחתונים או מקפים בלבד.',
    passwordRequired: 'יש להזין סיסמה.',
    passwordLength: 'הסיסמה חייבת להכיל בין 8 ל־128 תווים.',
  },
} as const;
