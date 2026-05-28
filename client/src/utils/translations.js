export const translations = {
  en: {
    signin: "Sign In",
    signup: "Sign Up",
    createAccount: "Create Account",
    username: "Username",
    password: "Password",
    needAccount: "Need an account?",
    haveAccount: "Already have an account?",
    loading: "Loading...",
    wordle: "WORDLE",
    logout: "Logout",
    guessWord: "Guess the word in {max} tries",
    wordLength: "Word length: {length} letters",
    playAgain: "Play Again",
    youWon: "🎉 You Won!",
    gameOver: "💔 Game Over!",
    wordWas: "The word was: {word}",
    language: "Language"
  },
  lv: {
    signin: "Pierakstīties",
    signup: "Reģistrēties",
    createAccount: "Izveidot kontu",
    username: "Lietotāja vārds",
    password: "Parole",
    needAccount: "Nepieciešams konts?",
    haveAccount: "Jau ir konts?",
    loading: "Ielādē...",
    wordle: "WORDLE",
    logout: "Izrakstīties",
    guessWord: "Uzminējiet vārdu {max} mēģinājumos",
    wordLength: "Vārda garums: {length} burti",
    playAgain: "Spēlēt vēlreiz",
    youWon: "🎉 Jūs uzvarējāt!",
    gameOver: "💔 Spēle beigusies!",
    wordWas: "Vārds bija: {word}",
    language: "Valoda"
  },
  ru: {
    signin: "Войти",
    signup: "Зарегистрироваться",
    createAccount: "Создать аккаунт",
    username: "Имя пользователя",
    password: "Пароль",
    needAccount: "Нужен аккаунт?",
    haveAccount: "Уже есть аккаунт?",
    loading: "Загрузка...",
    wordle: "WORDLE",
    logout: "Выход",
    guessWord: "Угадайте слово за {max} попыток",
    wordLength: "Длина слова: {length} букв",
    playAgain: "Играть снова",
    youWon: "🎉 Вы выиграли!",
    gameOver: "💔 Конец играй!",
    wordWas: "Слово было: {word}",
    language: "Язык"
  }
};

export const getTranslation = (lang, key, params = {}) => {
  let text = translations[lang]?.[key] || translations.en[key] || key;
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
};
