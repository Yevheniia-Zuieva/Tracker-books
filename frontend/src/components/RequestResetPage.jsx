/**
 * @file Сторінка запиту на відновлення пароля (RequestResetPage).
 * @description Компонент надає інтерфейс для введення електронної пошти користувача,
 * на яку буде надіслано посилання для скидання пароля. Включає обробку станів завантаження,
 * успішного виконання запиту та відображення помилок сервера.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { apiAuth } from "../api/ApiService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

/**
 * Компонент сторінки запиту на відновлення пароля.
 * * @component
 * @returns {React.JSX.Element} Рендерить форму введення email або повідомлення про успішну відправку.
 */
export function RequestResetPage() {
  /**
 * Стан для зберігання введеної електронної пошти
 * @type {string}
 */
  const [email, setEmail] = useState("");

  /**
 * Стан індикатора завантаження під час запиту до API
 * @type {boolean}
 */
  const [isLoading, setIsLoading] = useState(false);

  /**
 * Стан успішного завершення операції
 * @type {boolean}
 */
  const [isSuccess, setIsSuccess] = useState(false);

  /**
 * Стан для зберігання повідомлення про помилку від сервера
 * @type {string|null}
 */
  const [error, setError] = useState(null);

  /**
   * Обробник відправки форми.
   * Викликає сервіс відновлення пароля та керує станами інтерфейсу.
   * * @async
   * @param {React.FormEvent} e - Подія відправки форми.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Логування для діагностики в процесі розробки
    console.log("Спроба відправки пошти:", email);
    console.log("Чи існує функція?", apiAuth.resetPasswordRequest);

    try {
      /** Виклик API для створення запиту на скидання пароля */
      await apiAuth.resetPasswordRequest(email);
      setIsSuccess(true);
    } catch {
      setError("Щось пішло не так. Спробуйте пізніше.");
    } finally {
      setIsLoading(false);
    }
  };

  /** Екран успішного результату після відправки листа */
  if (isSuccess) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-md text-center p-6">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-xl mb-2">Перевірте вашу пошту</CardTitle>
          <CardDescription className="mb-6">
            Ми надіслали інструкції для відновлення пароля на{" "}
            <strong>{email}</strong>.
          </CardDescription>
          <Link to="/" className="w-full">
            <Button variant="outline" className="w-full">
              Повернутися на головну
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  /** Основний екран з формою запиту */
  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl bg-white">
        <CardHeader className="text-left">
          <Link
            to="/"
            className="text-sm text-slate-500 hover:text-slate-800 flex items-center mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Назад
          </Link>
          <CardTitle className="text-xl font-bold">
            Відновлення пароля
          </CardTitle>
          <CardDescription>
            Введіть email, прив'язаний до вашого акаунту
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Електронна пошта</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-[#2563eb]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Надіслати"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default RequestResetPage;
