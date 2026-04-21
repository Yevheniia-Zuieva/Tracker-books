/**
 * @file Сторінка підтвердження скидання пароля (ResetPasswordConfirmPage).
 * @description Фінальний етап відновлення доступу. Компонент отримує унікальні
 * ідентифікатори (uid та token) з URL, проводить клієнтську валідацію нового
 * пароля на відповідність вимогам безпеки та відправляє дані на сервер.
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { Lock, Loader2, AlertTriangle } from "lucide-react";

/**
 * Компонент сторінки підтвердження нового пароля.
 * * Реалізує вимоги безпеки проекту "Tracker Books":
 * - Забезпечення безпечного доступу.
 * - Клієнтська валідація складності пароля.
 * * @component
 * @returns {React.JSX.Element} Форма встановлення нового пароля.
 */
export function ResetPasswordConfirmPage() {
  /**
   * Параметри безпеки, витягнуті з URL-адреси
   * @type {Object}
   */
  const { uid, token } = useParams();
  const navigate = useNavigate();

  /**
 * Стан полів форми введення паролів
 * @type {Object}
 */
  const [formData, setFormData] = useState({
    new_password: "",
    re_new_password: "",
  });

  /**
 * Стан індикатора завантаження під час запиту
 * @type {boolean}
 */
  const [isLoading, setIsLoading] = useState(false);

  /**
 * Стан для відображення помилок валідації або сервера
 * @type {string|null}
 */
  const [error, setError] = useState(null);

  /**
   * Перевірка пароля на відповідність політиці безпеки.
   * Вимагає: мінімум 8 символів, цифру, велику та малу літери, спецсимвол.
   * @param {string} password - Пароль для перевірки.
   * @returns {boolean} Результат валідації.
   */
  const validatePassword = (password) => {
    const regex =
      /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    return regex.test(password);
  };

  /**
   * Обробник сабміту форми.
   * Проводить перевірку співпадіння паролів та їх складності перед відправкою.
   * У разі успіху перенаправляє на головну з повідомленням.
   * @async
   * @param {React.FormEvent} e - Подія відправки форми.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Перевірка валідності пароля
    if (!validatePassword(formData.new_password)) {
      setError(
        "Пароль не відповідає вимогам. Пароль має бути не менше 8 символів і містити великі та малі літери, цифри, а також спеціальні символи. Будь ласка, спробуйте ще раз.",
      );
      return;
    }

    // Перевірка на співпадіння паролів
    if (formData.new_password !== formData.re_new_password) {
      setError("Паролі не співпадають.");
      return;
    }

    setIsLoading(true);

    try {
      /** Виклик API для остаточного скидання пароля на бекенді */
      await apiAuth.resetPasswordConfirm(
        uid,
        token,
        formData.new_password,
        formData.re_new_password,
      );

      // Перехід до логіну з успішним статусом у state
      navigate("/", {
        state: { message: "Пароль успішно змінено! Увійдіть з новим паролем." },
      });
    } catch (err) {
      // Спеціальна обробка для недійсних посилань (прострочений токен)
      if (
        err.response &&
        (err.response.status === 400 || err.response.status === 403)
      ) {
        setError(
          "Помилка 403: У доступі відмовлено. Це посилання вже використане або недійсне.",
        );
      } else {
        setError("Виникла помилка при зміні пароля. Спробуйте ще раз.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Новий пароль</CardTitle>
          <CardDescription>
            Створіть новий надійний пароль для вашого акаунту
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Новий пароль</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.new_password}
                  onChange={(e) =>
                    setFormData({ ...formData, new_password: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Повторіть пароль</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.re_new_password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      re_new_password: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#2563eb]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Зберегти новий пароль"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ResetPasswordConfirmPage;
