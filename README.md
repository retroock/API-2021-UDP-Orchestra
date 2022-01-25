# Teaching-HEIGVD-RES-2020-Labo-Orchestra

## Admin

* **You can work in groups of 2 students**.
* It is up to you if you want to fork this repo, or if you prefer to work in a private repo. However, you have to **use exactly the same directory structure for the validation procedure to work**. 
* We expect that you will have more issues and questions than with other labs (because we have a left some questions open on purpose). Please ask your questions on Telegram / Teams, so that everyone in the class can benefit from the discussion.

## Objectives

This lab has 4 objectives:

* The first objective is to **design and implement a simple application protocol on top of UDP**. It will be very similar to the protocol presented during the lecture (where thermometers were publishing temperature events in a multicast group and where a station was listening for these events).

* The second objective is to get familiar with several tools from **the JavaScript ecosystem**. You will implement two simple **Node.js** applications. You will also have to search for and use a couple of **npm modules** (i.e. third-party libraries).

* The third objective is to continue practicing with **Docker**. You will have to create 2 Docker images (they will be very similar to the images presented in class). You will then have to run multiple containers based on these images.

* Last but not least, the fourth objective is to **work with a bit less upfront guidance**, as compared with previous labs. This time, we do not provide a complete webcast to get you started, because we want you to search for information (this is a very important skill that we will increasingly train). Don't worry, we have prepared a fairly detailed list of tasks that will put you on the right track. If you feel a bit overwhelmed at the beginning, make sure to read this document carefully and to find answers to the questions asked in the tables. You will see that the whole thing will become more and more approachable.


## Requirements

In this lab, you will **write 2 small NodeJS applications** and **package them in Docker images**:

* the first app, **Musician**, simulates someone who plays an instrument in an orchestra. When the app is started, it is assigned an instrument (piano, flute, etc.). As long as it is running, every second it will emit a sound (well... simulate the emission of a sound: we are talking about a communication protocol). Of course, the sound depends on the instrument.

* the second app, **Auditor**, simulates someone who listens to the orchestra. This application has two responsibilities. Firstly, it must listen to Musicians and keep track of **active** musicians. A musician is active if it has played a sound during the last 5 seconds. Secondly, it must make this information available to you. Concretely, this means that it should implement a very simple TCP-based protocol.

![image](images/joke.jpg)


### Instruments and sounds

The following table gives you the mapping between instruments and sounds. Please **use exactly the same string values** in your code, so that validation procedures can work.

| Instrument | Sound         |
|------------|---------------|
| `piano`    | `ti-ta-ti`    |
| `trumpet`  | `pouet`       |
| `flute`    | `trulu`       |
| `violin`   | `gzi-gzi`     |
| `drum`     | `boum-boum`   |

### TCP-based protocol to be implemented by the Auditor application

* The auditor should include a TCP server and accept connection requests on port 2205.
* After accepting a connection request, the auditor must send a JSON payload containing the list of <u>active</u> musicians, with the following format (it can be a single line, without indentation):

```
[
  {
  	"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
  	"instrument" : "piano",
  	"activeSince" : "2016-04-27T05:20:50.731Z"
  },
  {
  	"uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
  	"instrument" : "flute",
  	"activeSince" : "2016-04-27T05:39:03.211Z"
  }
]
```

### What you should be able to do at the end of the lab


You should be able to start an **Auditor** container with the following command:

```
$ docker run -d -p 2205:2205 res/auditor
```

You should be able to connect to your **Auditor** container over TCP and see that there is no active musician.

```
$ telnet IP_ADDRESS_THAT_DEPENDS_ON_YOUR_SETUP 2205
[]
```

You should then be able to start a first **Musician** container with the following command:

```
$ docker run -d res/musician piano
```

After this, you should be able to verify two points. Firstly, if you connect to the TCP interface of your **Auditor** container, you should see that there is now one active musician (you should receive a JSON array with a single element). Secondly, you should be able to use `tcpdump` to monitor the UDP datagrams generated by the **Musician** container.

You should then be able to kill the **Musician** container, wait 5 seconds and connect to the TCP interface of the **Auditor** container. You should see that there is now no active musician (empty array).

You should then be able to start several **Musician** containers with the following commands:

```
$ docker run -d res/musician piano
$ docker run -d res/musician flute
$ docker run -d res/musician flute
$ docker run -d res/musician drum
```
When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.


## Task 1: design the application architecture and protocols

| #  | Topic |
| --- | --- |
|Question | How can we represent the system in an **architecture diagram**, which gives information both about the Docker containers, the communication protocols and the commands? |
| | ![image](images/Diagram.png) |
|Question | Who is going to **send UDP datagrams** and **when**? |
| | Les containers musiciens vont envoyer des datagrames UDP toutes les secondes. |
|Question | Who is going to **listen for UDP datagrams** and what should happen when a datagram is received? |
| | Le container auditeur se mettra en écoute afin de récupérer les paquets UDP envoyé par les musiciens. Lorsqu'il en reçoit un, il ajoutera dans un tableau JSON le musicien (si celui-ci n'est pas déjà présent sinon rien ne sera fait). |
|Question | What **payload** should we put in the UDP datagrams? |
| | Le bruit de l'instrument de musique, l'id du container. |
|Question | What **data structures** do we need in the UDP sender and receiver? When will we update these data structures? When will we query these data structures? |
| | Pour le sender nous aurons un tableau JSON que nous enverrons au receiver. Ces données n'auront pas besoin d'être mise à jour car elle sont liées au container et elle ne change pas dans le temps (instrument, uuid et depuis quand le container est lancé). Pour le receiver, il contiendra aussi un tableau en JSON qu'il faudra mettre à jour à chaque fois qu'un nouveau musicien arrive ou part. Nous allons lorsque nous nous connectons au receiver (sur le port 2205) demander au serveur de nous envoyer la liste des musiciens présent. |


## Task 2: implement a "musician" Node.js application

| #  | Topic |
| ---  | --- |
|Question | In a JavaScript program, if we have an object, how can we **serialize it in JSON**? |
| | Nous pouvons utiliser la méthode : JSON.stringify(). |
|Question | What is **npm**?  |
| | Il s'agit du gestionnaire de package par défaut pour la plateforme Node javascript. On va avoir accès à plusieurs commandes qui va permettre de choisir les packages que l'on souhaite (node_modules avec package.json utilisé dans le labo HTTP infra). |
|Question | What is the `npm install` command and what is the purpose of the `--save` flag?  |
| | Cela va permettre d'installer un package et toute les dépendances de ce dernier. Le --save est utilisé afin de sauvegarder le package installé dans le fichier package.json. Si l'on possède une version de npm 5.0.0 ou plus récente, ce flag n'est plus nécessaire. (source : https://www.geeksforgeeks.org/what-is-the-meaning-of-save-for-npm-install/) |
|Question | How can we use the `https://www.npmjs.com/` web site?  |
| | Ce site fonctionne un peu comme docker-hub. Il répertorie tous les packages disponible. Depuis la page du package nous allons pouvoir voir toutes les dépendances nécessaire à ce package, la commande à entrer avec npm afin de l'installer et encore plein d'autres informations. |
|Question | In JavaScript, how can we **generate a UUID** compliant with RFC4122? |
| | Un package npm nommé `uuid` permet la génération d'un UUID qui respecte la norme RFC4122. |
|Question | In Node.js, how can we execute a function on a **periodic** basis? |
| | La méthode `setInterval()` permet d'effectuer une action / exécuter une fonction après un temps donné. Il est d'ailleurs possible de stocker cet interval et de le supprimer plus tard dans le code. Il est important de noter que la première fois exécution de la fonction passée en paramètre aura lieu après le temps donné (donc pas d'exécution au temps t=0). |
|Question | In Node.js, how can we **emit UDP datagrams**? |
| | Comme vu pendant le cours nous allons utiliser un module node.js nommé dgram qui va permettre d'utiliser des datagramme UDP avec le socket que nous utiliserons. |
|Question | In Node.js, how can we **access the command line arguments**? |
| | `process.argv()` permet de récupérer les arguments de la ligne de commande sous forme de tableau. |


## Task 3: package the "musician" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we **define and build our own Docker image**?|
| | Pour créer l'image docker, il faut avoir un fichier Dockerfile configuré correctement (doit posséder une image de base, etc...). Ensuite afin de build l'image il faut ouvrir un terminal dans le même dossier que ce fichier et faire la commande `docker build -t nomDeLImage .`. |
|Question | How can we use the `ENTRYPOINT` statement in our Dockerfile?  |
| | L'entrypoint fonctionne de la même manière que CMD, ce dernier va permettre d'exécuter une ligne de commande lors du lancement du container. Exemple : `ENTRYPOINT [ "node", "/opt/app/auditor.js" ]` |
|Question | After building our Docker image, how do we use it to **run containers**?  |
| | Utiliser la commande `docker run -d nomDeLImage`. Rajouter `-p` permettra de faire du port mapping afin de pouvoir accéder au container depuis la machine hôte. |
|Question | How do we get the list of all **running containers**?  |
| | `docker -ps`, utiliser `-a` afin de lister tous les containers. |
|Question | How do we **stop/kill** one running container?  |
| | `docker stop nomDuContainer` va permettre d'arrêter un container en marche. `docker kill nomDuContainer` va permettre de supprimer un container qui n'est pas en état de marche. |
|Question | How can we check that our running containers are effectively sending UDP datagrams?  |
| | On peut utiliser tcpdump ou wireshark. |


## Task 4: implement an "auditor" Node.js application

| #  | Topic |
| ---  | ---  |
|Question | With Node.js, how can we listen for UDP datagrams in a multicast group? |
| | Comme pour le musicien nous allons utiliser dgram afin de pouvoir écouter des paquets IP. Nous allons ensuite nous ajouter en tant que membre dans le groupe multicast (addMembership(adresse multicast)). |
|Question | How can we use the `Map` built-in object introduced in ECMAScript 6 to implement a **dictionary**?  |
| | Il s'agit d'un dictionnaire, chaque entrée de la Map contient un id unique et une valeur correspondante. Lorsque nous faisons un get(id), cela va chercher dans la Map si l'id est présent et nous retourner la valeur correspondante. |
|Question | How can we use the `Moment.js` npm module to help us with **date manipulations** and formatting?  |
| | Moment permet de faire des opérations (méthode add() par exemple), des comparaisons(isBefore ou isAfter) et du formatage de date. Ce qui est très pratique pour nous. |
|Question | When and how do we **get rid of inactive players**?  |
| | Après que l'auditeur n'ait pas reçu pendant 5 secondes un paquet d'un musicien. Nous allons stocker pour chaque musicien à qu'elle heure on reçoit son paquet, ensuite nous faisons une addition de 5 secondes et nous comparons si l'heure actuel est plus grande (utilisation de isBefore) que cette nouvelle heure calculée. Si elle est plus grande cela veut dire que le musicien envoie toujours des paquets, sinon on doit l'enlever de la liste. |
|Question | How do I implement a **simple TCP server** in Node.js?  |
| | Comme vu pendant le labo HTTP, il suffit d'utiliser express afin d'avoir accès aux différentes méthodes de gestion de serveurs comme listen(). |


## Task 5: package the "auditor" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we validate that the whole system works, once we have built our Docker image? |
| | En utilisant le script fournit et en faisant des tests de notre côté. Nous avons lancé 3 containers musiciens et un container auditor. En se connectant au site nous pouvions voir que les trois musiciens étaient détectés par l'auditor. Et lorsque nous avons éteint l'un des musiciens, il était détecté encore pendant 5 secondes et ensuite il disparaissait. Si on le rallumait il était instantanément rajouté dans la liste. |


## Constraints

Please be careful to adhere to the specifications in this document, and in particular

* the Docker image names
* the names of instruments and their sounds
* the TCP PORT number

Also, we have prepared two directories, where you should place your two `Dockerfile` with their dependent files.

### Validation
Have a look at the `validate.sh` script located in the top-level directory. This script automates part of the validation process for your implementation (it will gradually be expanded with additional operations and assertions). As soon as you start creating your Docker images (i.e. creating your Dockerfiles), you should **try to run it** to see if your implementation is correct. When you submit your project, the script will be used for grading, together with other criteria.
