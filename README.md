<h1 align="center">🦷 Smile Well PH 🦷</h1>

<p align="center">
  <img src="https://media1.tenor.com/m/BErxl4WqwW0AAAAC/dentist-mr.gif" width="1100px"> 
</p>

A comprehensive, full-stack internal dental clinic management system engineered specifically for SmileWell Dental Clinic. 
Pivoted to serve as a highly secure, tablet-optimized internal operational tool, 
this platform handles daily schedule management, comprehensive digital patient records, and seamless in-clinic patient onboarding. 🦷✨

## 🚀 Features

- 🗂️ **Comprehensive Dental Records** -- A robust, secure relational database architecture that stores everything a dentist needs at a glance: general patient info, detailed procedure histories, private clinical notes, digital consent forms, and real-time invoice and balance tracking.
  
- 📅 **Internal Clinic Calendar & Timetables** -- A streamlined, staff-facing daily schedule manager designed to organize clinic flow. Staff can easily log, adjust, and track appointments sourced from external communication channels (Facebook, Email, phone calls) in one centralized daily view.
  
- 📝 **Tablet-Optimized Patient Registration** -- A seamless, paperless intake flow designed for the clinic waiting room. Dentists can simply hand the clinic tablet to new patients to fill out their digital forms, which instantly generates a fresh, secure dental record file within the internal system.
  
- ⚙️ **Chair-Side Clinical Workflow** -- Engineered specifically for internal clinic operations, this system strips away public-facing portal bloat to deliver a fast, responsive, and secure administrative tool used directly by dental professionals on the floor.

## 🧱 Tech Stack
<table>
  <tr>
    <td align="center">
      <h3>💻 Frontend</h3>
      <a href="https://skillicons.dev">
        <img src="https://skillicons.dev/icons?i=html,css,js&theme=light&size=60" />
      </a>
    </td>
    <td align="center">
      <h3>⚙️ Backend</h3>
      <a href="https://skillicons.dev">
        <img src="https://skillicons.dev/icons?i=java,spring&theme=light&size=60" />
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <h3>🗄️ Database</h3>
      <a href="https://skillicons.dev">
        <img src="https://skillicons.dev/icons?i=mysql&theme=light&size=60" />
      </a>
    </td>
    <td align="center">
      <h3>🧰 Tools & IDEs</h3>
      <a href="https://skillicons.dev">
         <img src="https://skillicons.dev/icons?i=vscode,git,postman,docker&theme=light&size=60" />
      </a>
    </td>
  </tr>
</table>


## 📋 System Requirements

### **Core Infrastructure**
- **Java 25 LTS** — Backend runtime environment
- **Spring Boot 4.0.4** — REST API application framework
- **MySQL 8.0+** — Relational database server
- **Docker** — Containerization and local deployment environment

### **Dependecies**
- **Spring Web** — For RESTful 
- **Spring Data JPA** — For Data
- **MySQL Driver** — For Interacting With MySQL Database
- **Spring Security** — Access Controls & Security
- **Srpingboot Dev Tools** — LiveReloads & Dev QOL
- **Lombok** — Reduces Boilerplate & QOL

### **Development Environment**
- **Git** — Version control and repository management
- **VS Code** — Standardized IDE (requires *Extension Pack for Java*)
- **Modern Web Browser** — For testing the client and admin portals (Chrome, Edge, Safari, Firefox)

## 🛠️ How To Run The Wep App

### 1. Database & Environment Setup
Before starting the server, you must configure your local environment variables. 
1. Create a file named exactly `.env` inside the `BackEnd` directory (at the same level as the `pom.xml` file).
2. Add the following credentials, updating `DB_HOST` to the correct ZeroTier IP if you are connecting remotely:
```env
DB_HOST=(Your Host)
DB_PORT=(Your Port)
DB_NAME=(Your DB Name)
DB_USER=(Your User)
DB_PASS=(Your Pass)
```
   
### 2. Starting the Server
Spring Boot uses the Maven Wrapper to automatically download required dependencies and boot the embedded Tomcat server.
Open your terminal and run:

```bash
cd BackEnd
.\mvnw spring-boot:run
```

## 🧭 Roadmap

✅ Initial commit
- [ ] Login & Registration
- [ ] Homepage 
- [ ] Information Page
- [ ] Appointment Booking & Confirmation
- [ ] Messaging
- [ ] Patient Dental Records & Management
- [ ] Polish


## 🖼️ Screenshots

*(Coming soon)*

## 🎨 Figma Design

<p align="center"> 
 <a href="https://www.figma.com/design/YLllNckCXNF8604XdYXt4C/Smile-Well--Demo-?node-id=0-1&t=sLcc0x70WXjAxP1X-1" target="blank"> 
  <img src="https://img.shields.io/badge/Open%20in%20Figma-000000?style=for-the-badge&logo=figma&logoColor=white" alt="Figma Design Link"> </a> </p> 
  <p align="center"> Explore the full UI/UX prototype — including flows, screens, and design components. </p>


## 🖋️👥 Team

- 💻 Lead Dev - [![GitHub](https://img.shields.io/badge/GitHub-frostishyper-181717?style=flat&logo=github)](https://github.com/frostishyper) 
- 💻 Backend Dev(s) - [![GitHub](https://img.shields.io/badge/GitHub-yeeard-181717?style=flat&logo=github)](https://github.com/yeeard) [![GitHub](https://img.shields.io/badge/GitHub-Ezickle-181717?style=flat&logo=github)](https://github.com/Ezickle)  [![GitHub](https://img.shields.io/badge/GitHub-Hallow--Gl-181717?style=flat&logo=github)](https://github.com/Hallow-Gl)
- 🎨 Front-End Design -  [![GitHub](https://img.shields.io/badge/GitHub-frostishyper-181717?style=flat&logo=github)](https://github.com/frostishyper) ![GitHub](https://img.shields.io/badge/GitHub-yeeard-181717?style=flat&logo=github)
- ⚙️ System Architect - [![GitHub](https://img.shields.io/badge/GitHub-frostishyper-181717?style=flat&logo=github)](https://github.com/frostishyper)

