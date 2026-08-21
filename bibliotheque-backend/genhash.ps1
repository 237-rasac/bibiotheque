Set-Location "C:\Users\pc\Documents\bibiotheque\bibliotheque-backend"
$cp = (Get-Content cp.txt -Raw)
javac -cp $cp HashGen.java
java -cp "$cp;.;HashGen" HashGen
