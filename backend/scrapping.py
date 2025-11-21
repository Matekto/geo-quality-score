import trafilatura
# Récupération de l'URL (Attention aux blocages, voir section 2.3)
downloaded = trafilatura.fetch_url('https://github.blog/2019-03-29-leader-spotlight-erin-spiceland/')
print(downloaded)
# Extraction du texte principal sans le bruit HTML
text = trafilatura.extract(downloaded)
# Sauvegarde explicite en UTF-8
with open('data/bnp_content.txt', 'w', encoding='utf-8') as f:
    f.write(text)