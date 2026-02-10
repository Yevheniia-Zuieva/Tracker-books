from djoser import email

class CustomPasswordResetEmail(email.PasswordResetEmail):
    def get_context_data(self):
        context = super().get_context_data()
        
        context['domain'] = 'localhost:5173'
        context['site_name'] = 'Tracker Books'
        
        return context