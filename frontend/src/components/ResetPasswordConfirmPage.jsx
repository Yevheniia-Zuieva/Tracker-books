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

export function ResetPasswordConfirmPage() {
  const { uid, token } = useParams(); // Отримуємо параметри з URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    new_password: "",
    re_new_password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const validatePassword = (password) => {
    // Регулярний вираз для вимоги пароля
    const regex =
      /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return regex.test(password);
  };

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
      // Відправка на сервер
      await apiAuth.resetPasswordConfirm(
        uid,
        token,
        formData.new_password,
        formData.re_new_password,
      );

      navigate("/", {
        state: { message: "Пароль успішно змінено! Увійдіть з новим паролем." },
      });
    } catch (err) {
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
