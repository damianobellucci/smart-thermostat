#include <Arduino.h>
#ifdef ESP32
#include <WiFi.h>
#include <AsyncTCP.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#endif
#include <ESPAsyncWebServer.h>


/************************WIFI************************************/
// Set your Static IP address
IPAddress local_IP(192, 168, 1, 30);
// Set your Gateway IP address
IPAddress gateway(192, 168, 1, 1);

IPAddress subnet(255, 255, 0, 0);
IPAddress primaryDNS(8, 8, 8, 8);   //optional
IPAddress secondaryDNS(8, 8, 4, 4); //optional

const char ssid[] = "Bellucci";
const char pass[] = "casabelluccibiocco5865";
WiFiClient net;

void wifiConnect() {
  Serial.print("checking wifi...");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nconnected!");
}

void wifi_setup(){
  WiFi.begin(ssid, pass);
  while (!WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS)) {
    Serial.println("STA Failed to configure");
  }
  Serial.println(WiFi.localIP());
  while(WiFi.status() != WL_CONNECTED){
    wifiConnect();
  }
}

void wifi_loop_CheckReconnect(){
  if(WiFi.status() != WL_CONNECTED){
    wifiConnect();
  }
}
/************************************************************/

/*********************************ASYNC HTTP SERVER****************/
AsyncWebServer server(80);
const char* PARAM_MESSAGE = "t";

void notFound(AsyncWebServerRequest *request) {
    request->send(404, "text/plain", "Not found");
}

const char* test [24]={"0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23"};
float soglia=23.5;
bool vett[24]={0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
float gradiC=19.4;
bool stato=1; 

/********************************************************************/

void setup() {
  Serial.begin(9600);

  /************************WIFI************************************/
  wifi_setup();
  /************************************************************/

/*******************************HTTP SERVER***********************************************/

  server.on("/setparameters", HTTP_POST, [](AsyncWebServerRequest *request){
    Serial.println("POST request arrived.");
    String payload;  
    
    for(int i=0;i<24;i++){
      if (request->hasParam(test[i], true)) {
        payload = request->getParam(test[i], true)->value();
        vett[i]=payload.toInt();
      }
    }
    if (request->hasParam("t", true)) {
      payload = request->getParam("t", true)->value();
      soglia=payload.toFloat();
    }
    request->send(200, "text/plain", "ok");
  });

  server.on("/currentstate", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET request arrived.");
    int paramsNr = request->params();
    Serial.println(paramsNr);


    String finalString="";
 
    for(int i=0;i<paramsNr;i++){
        AsyncWebParameter* p = request->getParam(i);
        if(p->name()=="knights"){
          String str_knights="knights:";
          for (int i=0;i<24;i++){
            str_knights=str_knights+String(vett[i]);
            if(i!=23) str_knights=str_knights+",";
            else str_knights=str_knights+";";
          }
          finalString=finalString+str_knights;
        }
        if(p->name()=="temperature"){
          String str_temperature="temperature:";
          str_temperature=str_temperature+String(gradiC)+";";
          finalString=finalString+str_temperature;
          }
        if(p->name()=="status"){
          String str_status="status:";
          str_status=str_status+String(stato)+";";
          finalString=finalString+str_status;
        }
        if(p->name()=="threshold"){
          String str_threshold="threshold:";
          str_threshold=str_threshold+String(soglia)+";";
          finalString=finalString+str_threshold;
        }
    }
    request->send(200, "text/plain", finalString);
  });
  
  server.onNotFound(notFound);
  server.begin();
/******************************************************************************/

}


void loop() {
  /************************WIFI************************************/
  wifi_loop_CheckReconnect();
  /************************************************************/

  /************************DEBUGGING****************************/
  delay(3000);
  for(int i=0;i<24;i++){
    Serial.print(i);
    Serial.print(" : ");
    Serial.print(vett[i]);
    Serial.println();
  }
  /**************************************************************/
}
