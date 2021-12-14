#include <Arduino.h>
#ifdef ESP32
#include <WiFi.h>
#include <AsyncTCP.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#endif
#include <ESPAsyncWebServer.h>
AsyncWebServer server(80);

const char* PARAM_MESSAGE = "message";

void notFound(AsyncWebServerRequest *request) {
    request->send(404, "text/plain", "Not found");
}

/**********SOIL MOISTURE SENSOR************************/
int readSoilMoisture(){
    const int dry = 2865;
    const int wet = 1164;
    int pin_soil_moisture = 34;
    int sensorValue = analogRead(pin_soil_moisture);
    int value = map(sensorValue,wet,dry,100,0);
    if(value>100)return 100;
    else if(value<0)return 0;
    return(value);
}

/*********TEMPERATURE/HUMIDITY SENSOR*******************/

#include <DHT.h>
#define DHTPIN 13
#define DHTTYPE DHT22
DHT dht(DHTPIN,DHTTYPE);

/*******************WIFI***********************************/
#include <WiFi.h>

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
/******************************************************/

/*****************MQTT*********************************/
#include <MQTT.h>
MQTTClient client;

#define mqtt_server "130.136.2.70"
#define mqtt_port 1883
#define mqtt_user "IOTuser"
#define mqtt_password "IOTuser"
#define in_topic "damianobellucci/test"
#define topic_setting_parameters "damianobellucci/test_setting_parameters"

void mqttConnect(){
  //bool connect(const char clientID[], const char username[], const char password[], bool skip = false);
  while (!client.connect("arduino", mqtt_user, mqtt_password)) {
    Serial.print(".");
    delay(1000);
  }
  
  Serial.println("\n mqtt connected!");

  //client.subscribe(topic_setting_parameters, 2);
 
  
}


int sample_frequency = NULL;
float min_temp, max_temp, min_moi, max_moi;

void messageReceived(String payload) {


  int ind1 = payload.indexOf(";");
  sample_frequency=payload.substring(0,ind1).toInt();

  int ind2 = payload.indexOf(";", ind1+1 );
  min_temp = payload.substring(ind1+1, ind2+1).toFloat(); 

  int ind3 = payload.indexOf(";", ind2+1 );
  max_temp = payload.substring(ind2+1, ind3+1).toFloat();

  int ind4 = payload.indexOf(";", ind3+1 );
  min_moi = payload.substring(ind3+1, ind4+1).toFloat();

  int ind5 = payload.indexOf(";", ind4+1 );
  max_moi = payload.substring(ind4+1, ind5+1).toFloat();

  Serial.println("Sample frequency:");
  Serial.println(sample_frequency);

  Serial.println("min temp:");
  Serial.println(min_temp);

  Serial.println("max temp:");
  Serial.println(max_temp);

  Serial.println("min_moi:");
  Serial.println(min_moi);

  Serial.println("max_moi:");
  Serial.println(max_moi);


}

/********************************************************/
#include <HTTPClient.h>

#define ID_THIS_ESP32 "1520"
#define GPS_COORDINATES "41.890209,12.492231"
#define ONBOARD_LED 2

bool inizialized_setting_parameters = false;

String raw_first_setting_parameters;

#define  SERVER_IP  "http://192.168.1.85:3450/getparameters"

bool inizializedSettingParameters(){
    HTTPClient http;
    http.begin(SERVER_IP);
    int httpCode = http.GET();                                      
    if (httpCode > 0) {
        String payload = http.getString();
        //Serial.println(httpCode);
        Serial.println(payload);
        Serial.println("Parametri di settaggio inizializzati.");
        http.end();
        raw_first_setting_parameters=payload;
        return true;
      }
    else {
      http.end();
      Serial.println("Parametri di settaggio non ancora inizializzati...");
      //Serial.println(httpCode);
      return false;
    }
}

// Set your Static IP address
IPAddress local_IP(192, 168, 1, 30);
// Set your Gateway IP address
IPAddress gateway(192, 168, 1, 1);

IPAddress subnet(255, 255, 0, 0);
IPAddress primaryDNS(8, 8, 8, 8);   //optional
IPAddress secondaryDNS(8, 8, 4, 4); //optional

String ip_server=" ";

void setup() {
  Serial.begin(115200);
  
  dht.begin();
  
  WiFi.begin(ssid, pass);

 
  while (!WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS)) {
    Serial.println("STA Failed to configure");
  }
  Serial.println(WiFi.localIP());
  client.begin(mqtt_server,mqtt_port, net);

  
  wifiConnect();


  while (!inizializedSettingParameters()){
    if(WiFi.status() != WL_CONNECTED){
      wifiConnect();
    }
  }
  
  messageReceived(raw_first_setting_parameters);

  pinMode(ONBOARD_LED,OUTPUT);


      /*
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
      request->send(200, "text/plain", "Hello, world");
  });
  // Send a GET request to <IP>/get?message=<message>
  server.on("/get", HTTP_GET, [] (AsyncWebServerRequest *request) {
      String message;
      if (request->hasParam(PARAM_MESSAGE)) {
          message = request->getParam(PARAM_MESSAGE)->value();
      } else {
          message = "No message sent";
      }
      request->send(200, "text/plain", "Hello, GET: " + message);
  });
  */

  // Send a POST request to <IP>/post with a form field message set to <message>
  server.on("/post", HTTP_POST, [](AsyncWebServerRequest *request){
      Serial.println("POST request arrived.");
      String payload;
      if (request->hasParam(PARAM_MESSAGE, true)) {
          payload = request->getParam(PARAM_MESSAGE, true)->value();
      } else {
          payload = "No message sent";
      }
      
      int ind1 = payload.indexOf(";");
      sample_frequency=payload.substring(0,ind1).toInt();
    
      int ind2 = payload.indexOf(";", ind1+1 );
      min_temp = payload.substring(ind1+1, ind2+1).toFloat(); 
    
      int ind3 = payload.indexOf(";", ind2+1 );
      max_temp = payload.substring(ind2+1, ind3+1).toFloat();
    
      int ind4 = payload.indexOf(";", ind3+1 );
      min_moi = payload.substring(ind3+1, ind4+1).toFloat();
    
      int ind5 = payload.indexOf(";", ind4+1 );
      max_moi = payload.substring(ind4+1, ind5+1).toFloat();
    
      Serial.println("Sample frequency:");
      Serial.println(sample_frequency);
    
      Serial.println("min temp:");
      Serial.println(min_temp);
    
      Serial.println("max temp:");
      Serial.println(max_temp);
    
      Serial.println("min_moi:");
      Serial.println(min_moi);
    
      Serial.println("max_moi:");
      Serial.println(max_moi);
    
      
      request->send(200, "text/plain", "Hello, POST: " + String(payload));
  });

    // Send a POST request to <IP>/post with a form field message set to <message>
  server.on("/bulksetparameters", HTTP_POST, [](AsyncWebServerRequest *request){
      Serial.println("POST request arrived.");
      String payload;
      if (request->hasParam(PARAM_MESSAGE, true)) {
          payload = request->getParam(PARAM_MESSAGE, true)->value();
      } else {
          payload = "No message sent";
      }
      
    
      Serial.println("Sample bulk:");
      Serial.println(payload);

      request->send(200, "text/plain", "Hello, POST: " + payload);
  });



  server.onNotFound(notFound);
  server.begin();



}

float calculateSHI(float temperature, int moi){
  float avgTEMP = (max_temp-min_temp)/2;
  float avgSOIL = (max_moi-min_moi)/2;
  
  float x=temperature-avgTEMP;
  if(x<0){
    x=-x;
  }

  float y = moi-avgSOIL;

  if(y<0){
    y=-y;
  }
  
  float SHI = 0.5*x+0.5*y;
  
  return(SHI);
}

void loop(){
 
  //wifi
  if(WiFi.status() != WL_CONNECTED){
    wifiConnect();
  }
  

  //mqtt
  client.loop();
  if(!client.connected()){
    mqttConnect();
  }
   

  //collecting sensor data
  if(sample_frequency!=NULL){
    
    int soil_moisture = readSoilMoisture();
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    float SHI=calculateSHI(temperature, soil_moisture);

    String payload_string;
    String comma=";";
     
    payload_string.concat(String(temperature));
    payload_string.concat(comma);
    payload_string.concat(String(humidity));
    payload_string.concat(comma);
    payload_string.concat(String(ID_THIS_ESP32));
    payload_string.concat(comma);
    payload_string.concat(String(GPS_COORDINATES));
    payload_string.concat(comma);
    payload_string.concat(String(WiFi.RSSI()));
    payload_string.concat(comma);
    payload_string.concat(soil_moisture);
    payload_string.concat(comma);
    payload_string.concat(SHI);
    payload_string.concat(comma);
    
    char payload[payload_string.length()+1];
    payload_string.toCharArray(payload, payload_string.length()+1);
    Serial.println(payload);
    
    client.publish(in_topic,payload ,strlen(payload), false, 2);

    if(temperature<min_temp || temperature>max_temp ){
      Serial.println("blinking led for temperature out of range");
      digitalWrite(ONBOARD_LED,HIGH);
      delay(100);
      digitalWrite(ONBOARD_LED,LOW);
    }
    if(soil_moisture<min_moi || soil_moisture>max_moi){
      Serial.println("blinking led for soil moisture out of range");
      digitalWrite(ONBOARD_LED,HIGH);
      delay(100);
      digitalWrite(ONBOARD_LED,LOW);
    }
    delay(sample_frequency);    
  }
  }
