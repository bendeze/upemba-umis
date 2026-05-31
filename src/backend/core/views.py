from django.views.generic import TemplateView

class IndexView(TemplateView):
    """
    Serves the pre-compiled static Next.js frontend index page.
    """
    template_name = "index.html"
