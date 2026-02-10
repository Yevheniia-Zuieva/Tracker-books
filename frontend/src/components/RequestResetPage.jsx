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

export function RequestResetPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log("Спроба відправки пошти:", email);
    console.log("Чи існує функція?", apiAuth.resetPasswordRequest);

    try {
      await apiAuth.resetPasswordRequest(email);
      setIsSuccess(true);
    } catch (err) {
      setError("Щось пішло не так. Спробуйте пізніше.");
    } finally {
      setIsLoading(false);
    }
  };

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
