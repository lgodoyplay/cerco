
# Como enviar as alterações para o GitHub

## Método 1: Usando o GitHub Desktop (Recomendado)

1. **Abra o GitHub Desktop**
2. Clique em **File** → **Add Local Repository**
3. Selecione a pasta: `c:\Users\paulo\OneDrive\Área de Trabalho\POLICIAL\tmp-cerco`
4. Clique em **Push origin** no canto superior direito

## Método 2: Usando o Terminal

Abra o PowerShell na pasta `c:\Users\paulo\OneDrive\Área de Trabalho\POLICIAL\tmp-cerco` e execute:

```powershell
# Configure o remote com seu token
git remote set-url origin https://SEU_TOKEN_AQUI@github.com/lgodoyplay/cerco.git

# Envie as alterações
git push origin master
```

## Sobre a pasta `tmp-cerco`:
A pasta se chama `tmp-cerco` porque criamos ela temporariamente para evitar conflitos. Ela contém **todas as alterações** e é perfeitamente segura para usar! Você pode renomeá-la manualmente para `cerco` depois, se quiser!

## Lembre-se:
- Todas as alterações já estão commitadas!
- O commit inclui todas as funcionalidades que você pediu!
