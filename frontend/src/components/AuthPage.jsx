import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  BookOpen,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
// Імпортуємо наш API сервіс
import { apiAuth } from "../api/ApiService";

export function AuthPage({ onAuth }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerError, setRegisterError] = useState(null);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  //  ЛОГІКА ВХОДУ
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);

    //Базова перевірка для логіну
    if (!loginData.email || !loginData.password) {
      setLoginError("Введіть пошту та пароль.");
      return;
    }

    setIsLoginLoading(true);

    try {
      // Отримуємо токени
      await apiAuth.login(loginData.email, loginData.password);

      // Отримуємо профіль користувача
      const userProfile = await apiAuth.getProfile();

      const token = localStorage.getItem("access_token") || "";
      onAuth(userProfile, token);
    } catch (error) {
      console.error("Помилка входу:", error);
      if (error.response && error.response.data) {
        setLoginError("Невірна електронна пошта або пароль.");
      } else {
        setLoginError("Помилка з'єднання з сервером. Спробуйте пізніше.");
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  //  ВАЛІДАЦІЯ РЕЄСТРАЦІЇ
  const validateRegisterForm = () => {
    const { name, email, password, confirmPassword } = registerData;

    // Негативна перевірка: пусті поля
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      return "Усі поля є обов’язковими для заповнення";
    }

    // Негативна перевірка: формат пошти
    // Вимагається: @, домен, крапку та доменну зону (мінімум 2 літери)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return "Неправильний формат електронної пошти. Будь ласка, спробуйте ще раз.";
    }

    // Негативна перевірка: вимоги до пароля
    // Мінімум 8 символів, 1 цифра, 1 велика літера, 1 спецсимвол
    const passwordRegex =
      /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return "Пароль не відповідає вимогам. Пароль має бути не менше 8 символів і містити великі та малі літери, цифри, а також спеціальні символи. Будь ласка, спробуйте ще раз.";
    }

    // Негативна перевірка: співпадіння паролів
    if (password !== confirmPassword) {
      return "Паролі не співпадають";
    }

    return null; // Помилок немає
  };

  //  ЛОГІКА РЕЄСТРАЦІЇ
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError(null);

    // Валідація на клієнті
    const validationError = validateRegisterForm();
    if (validationError) {
      setRegisterError(validationError);
      return;
    }

    setIsRegisterLoading(true);

    try {
      // Спроба реєстрації на сервері
      await apiAuth.register({
        email: registerData.email,
        password: registerData.password,
        username: registerData.name,
        re_password: registerData.confirmPassword,
      });

      // Успішна реєстрація -> Автоматичний вхід
      await apiAuth.login(registerData.email, registerData.password);
      const userProfile = await apiAuth.getProfile();
      const token = localStorage.getItem("access_token") || "";
      onAuth(userProfile, token);
    } catch (error) {
      console.error("Помилка реєстрації:", error);

      let errorMessage = "Не вдалося створити акаунт.";

      // Обробка помилок від бекенда
      if (error.response && error.response.data) {
        const data = error.response.data;

        // Перевірка на існуючий email
        if (data.email) {
          const emailErrors = Array.isArray(data.email)
            ? data.email.join(" ")
            : String(data.email);
          // Rлючові слова, які повертає сервер
          if (
            emailErrors.toLowerCase().includes("unique") ||
            emailErrors.toLowerCase().includes("exist") ||
            emailErrors.toLowerCase().includes("already")
          ) {
            errorMessage =
              "Користувач із такою адресою електронної пошти вже зареєстрований. Будь ласка, введіть іншу адресу електронної пошти";
          } else {
            // Інша помилка пошти
            errorMessage = emailErrors;
          }
        } else if (data.password) {
          // Якщо сервер має свої вимоги до пароля
          errorMessage = Array.isArray(data.password)
            ? data.password.join(" ")
            : String(data.password);
        } else {
          // Fallback для будь-яких інших помилок
          errorMessage = "Помилка сервера. Перевірте введені дані.";
        }
      }

      setRegisterError(errorMessage);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Логотип та заголовок */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2563eb] rounded-full mb-4 shadow-sm">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-1">
            Читацький Щоденник
          </h1>
          <p className="text-sm text-slate-500">
            Ваш персональний трекер прочитаних книг
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          {/* Стилізовані вкладки */}
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 mb-4 rounded-lg">
            <TabsTrigger
              value="login"
              className="w-full flex items-center justify-center rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Вхід
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="w-full flex items-center justify-center rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Реєстрація
            </TabsTrigger>
          </TabsList>

          {/* Форма Входу */}
          <TabsContent value="login">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-xl font-bold text-left">
                  Вхід до акаунта
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Введіть свої дані для входу в систему
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-5" noValidate>
                  {/* Електронна пошта */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="login-email"
                      className="text-sm font-medium"
                    >
                      Електронна пошта
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10 bg-slate-50/50 border-slate-200 focus:ring-[#2563eb]"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        disabled={isLoginLoading}
                      />
                    </div>
                  </div>

                  {/* Пароль */}
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Введіть пароль"
                        className="pl-10 pr-10 bg-slate-50/50 border-slate-200"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            password: e.target.value,
                          })
                        }
                        disabled={isLoginLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Чекбокс та Забули пароль */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        className="border-slate-300 data-[state=checked]:bg-[#2563eb]"
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm text-slate-600 cursor-pointer"
                      >
                        Запам'ятати мене
                      </Label>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-[#2563eb] hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      Забули пароль?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-6"
                    disabled={isLoginLoading}
                  >
                    {isLoginLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Увійти"
                    )}
                  </Button>
                  {loginError && (
                    <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600 font-medium">
                        {loginError}
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Форма Реєстрації */}
          <TabsContent value="register">
            <Card className="border-slate-200 shadow-xl shadow-slate-200/50 bg-white">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-xl font-bold text-left">
                  Створити акаунт
                </CardTitle>
                <CardDescription className="text-slate-500 text-left">
                  Почніть вести свій читацький щоденник сьогодні
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleRegister}
                  className="space-y-4"
                  noValidate
                >
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Ім'я</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#2563eb]" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Ваше ім'я"
                        className="pl-10 bg-slate-50 border-slate-200 focus:border-[#2563eb] focus:ring-[#2563eb]"
                        value={registerData.name}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            name: e.target.value,
                          })
                        }
                        disabled={isRegisterLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Електронна пошта</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#2563eb]" />
                      <Input
                        id="register-email"
                        type="text"
                        placeholder="your@email.com"
                        className="pl-10 bg-slate-50 border-slate-200 focus:border-[#2563eb] focus:ring-[#2563eb]"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                        disabled={isRegisterLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Пароль</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#2563eb]" />
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Створіть пароль"
                        className="pl-10 pr-10 bg-slate-50 border-slate-200 focus:border-[#2563eb] focus:ring-[#2563eb]"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                        disabled={isRegisterLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Підтвердження</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#2563eb]" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Повторіть пароль"
                        className="pl-10 pr-10 bg-slate-50 border-slate-200 focus:border-[#2563eb] focus:ring-[#2563eb]"
                        value={registerData.confirmPassword}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            confirmPassword: e.target.value,
                          })
                        }
                        disabled={isRegisterLoading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {registerError && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                      {registerError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-6 text-base shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30"
                    disabled={isRegisterLoading}
                  >
                    {isRegisterLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Реєстрація...
                      </>
                    ) : (
                      "Створити акаунт"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
