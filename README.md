# Valutatore_Discromatopsia_Web
## Prerequisiti
 - Docker
 - Docker compose

## Variabili d'ambiente
Le variabili d'ambiente sono per le applicazioni sono scritte all'interno del file compose.yml sotto la voce "environment" dei due container.

## Avvio App
Come prima cosa creare una cartella "db" a livello del file compose.yml. In questa cartella verrà salvato il database quando si ferma l'applicazione. 
Per avviare l'applicazione bisogna eseguire il seguente comando

`docker compose up`

il sito sarà raggiungibile su "http://localhost:3000"