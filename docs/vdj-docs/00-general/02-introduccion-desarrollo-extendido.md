---
title: "VirtualDJ - VDJPedia - Developers"
source: "https://www.virtualdj.com/wiki/Developers.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
**Developer SDK**

---

---

  
VirtualDJ offers a high level of customization. In addition of a long list of internal options, you can create your own interface or add some new features to VirtualDJ thanks to a SDK (Software Development Kit) defined for the following part of the software:  

- Skins
- Translations
- Controllers
- Effects / Plugins
- Database

  
**/!\\** All the XML files listed below use UTF-8 encoding  
  
**Skins**

---

---

  
This section is dedicated to the creation or modification of a skin. A skin is a .zip file containing mainly the following files:  

- the\_name\_of\_your\_skin.png (other picture formats are available)
- the\_name\_of\_your\_skin.xml

  
To create a modification of the default skin, simply open VirtualDJ, go to the Interface config page, select the default skin and click 'edit this skin' at the top right to extract the skin for you to start editing. A full guide can be found [here](https://www.virtualdj.com/wiki/modifyaskin.html).  
  
The skin must be copied in the following folders:  
\[PC\]\[Mac\].\\Documents\\VirtualDJ\\Skins\\  
  

- [**Skin SDK**](https://www.virtualdj.com/wiki/SkinSDK8.html)

  
  
**Translations**

---

---

  
This section is dedicated to the creation or modification of a translation. Translations in VirtualDJ are composed of .xml files:  

- the\_name\_of\_your\_language.xml

  

- [**Translations information and tools**](https://www.virtualdj.com/wiki/languagediff.html)

  
  
The translation must be copied in the following folders:  
\[PC\]\[Mac\] .\\Documents\\VirtualDJ\\Languages\\  
  
[**Controllers**](https://www.virtualdj.com/wiki/Controller%20Developers.html)

---

---

  
A controller in VirtualDJ is defined by two XML files, a "definition" file and a "mapping" file.  
The definition file gives a human-readable name to every MIDI code or HID zone.  
The mapping file associates each name of the definition file with an action in [VDJscript](https://www.virtualdj.com/wiki/VDJscript.html).  
  
Many controllers already have a [definition file embedded inside VirtualDJ](https://www.virtualdj.com/products/hardware.html).  
If you have a controller that is not recognized natively by VirtualDJ, or if you are a manufacturer working on a new controller, it is very easy to create a new definition file for this controller.  
  
More information about each part:  
[**Controller MIDI definition**](https://www.virtualdj.com/wiki/ControllerDefinitionMIDIv8.html)  
[**Controller HID definition**](https://www.virtualdj.com/wiki/ControllerDefinitionHIDv8.html)  
[**Controller Mapping**](https://www.virtualdj.com/wiki/ControllerMappingFile_v8.html)  
  
The definition file must be copied in the following folders:  
\[PC\]\[Mac\] .\\Documents\\VirtualDJ\\Devices\\  
  
The mapping file must be copied in the following folders:  
\[PC\]\[Mac\] .\\Documents\\VirtualDJ\\Mappers\\  
  
**Effects / Plugins**

---

---

  
Plugins in VirtualDJ are .dll (or .bundle on Mac) files that extend the functions of the software.  
  
In order to create a plugin, you will have to use a compiler that let you create .dll or .bundle files.  
On Windows, you can use the free [Microsoft Visual Studio Express/Community](http://msdn.microsoft.com/vstudio/express/beginner/). On Mac, you can use the free [XCode](http://www.apple.com/macosx/features/xcode/).  
Plugins in VirtualDJ look a lot like COM objects, so any languages that can create COM objects can create a plugin for VirtualDJ (Visual Basic, C#, etc).  
Still, we highly recommend to use C++, since that's the native language of the header files, and that's also the language in which you'll find all the help on the forums here.  
  
Once you are ready to start creating your plugins, you'll need to download and include the header files that define the basic plugin structure.  
  
You have 4 main categories of plugins:  

- General plugins: Plugins that are loaded on startup and perform actions on their own.
- Dsp plugins: Audio effects that interact with the sound.
- VideoEffect plugins: Video effects that add some special effect to the video output.
- VideoTransition plugins: Video effects that define a new way to crossfade from one video to another.

  
You need to make your own plugin derive from the interface class IVdjPluginXXXX.  
Then you should implement the DllGetClassObject() function to return a new instance of your plugin's class (derived from the IVdjPluginXXXX class).  
  
[List of GUID used for VirtualDJ plugins](https://www.virtualdj.com/wiki/Plugins_GUID.html)  
  
The plugin must be copied in the following folders:  
\[PC\] .\\Documents\\VirtualDJ\\Plugins\\{Sub-Folder} for VirtualDJ - 32bit (dll in 32bit)  
\[PC\] .\\Documents\\VirtualDJ\\Plugins64\\{Sub-Folder} for VirtualDJ - 64bit (dll in 64bit)  
\[Mac\] ./Documents/VirtualDJ/Plugins64/{Sub-Folder} for VirtualDJ - 64bit (bundle in 64bit)  
\[Mac Arm/Apple Silicon\] ./Documents/VirtualDJ/PluginsArm/{Sub-Folder} for VirtualDJ - ARM 64bit (bundle in 64bit)  
  
where {Sub-Folder} depends on the nature of your plugin  
  
**Plugin SDK v8 - VirtualDJ 8** [What's new?](https://www.virtualdj.com/wiki/Plugins_SDKv8_New.html)  
  

- [VirtualDJ8\_SDK\_20211003.zip](https://www.virtualdj.com/developers/VirtualDJ8_SDK_20211003.zip) (header files for all types of plug-ins)
- [vdjPlugin8.h](https://www.virtualdj.com/wiki/Plugins_SDKv8.html) (basic common base-class for all plugins)
- [vdjDsp8.h](https://www.virtualdj.com/wiki/Plugins_SDKv8_Dsp.html) (base classes for all Dsp plugins)
- [vdjVideo8.h](https://www.virtualdj.com/wiki/Plugins_SDKv8_Video.html) (base classes for all Video plugins) [(How To)](https://www.virtualdj.com/wiki/Plugins_SDKv8_VideoExplanations.html)
- [vdjOnlineSource.h](https://www.virtualdj.com/wiki/Plugins_SDKv8_OnlineSource.html) (base classes for all Online Source plugins)

  
Examples of source code:  

- [Basic plugin (with default interface)](https://www.virtualdj.com/wiki/Plugins_SDKv8_Example.html)
- [Basic plugin (with skin interface)](https://www.virtualdj.com/wiki/Plugins_SDKv8_Example4.html)
- [Audio plugin (DSP) - Example 1](https://www.virtualdj.com/wiki/Plugins_SDKv8_Example2.html) / [Audio plugin (DSP) - Example 2](https://www.virtualdj.com/wiki/Plugins_SDKv8_Example1.html)
- [Audio plugin (Buffer DSP)](https://www.virtualdj.com/wiki/Plugins_SDKv8_Example6.html)
- [Video FX plugin](https://www.virtualdj.com/wiki/Plugins_SDKv8_Example3.html)
- [Video Transition plugin](https://www.virtualdj.com/wiki/Plugins_SDKv8_Example5.html)
- [Online Source plugin](https://www.virtualdj.com/wiki/Plugins_SDKv8_Example7.html)

  
  
**Database**

---

---

  
This section is dedicated to the reading of the database outside VirtualDJ. Database in VirtualDJ are composed of .xml files:  

- "database.xml" since VirtualDJ v8.0
- "VirtualDJ Database v6.xml" before VirtualDJ v8.0

  
[**Database structure**](https://www.virtualdj.com/wiki/VDJ_database.html)  
  
**/!\\** No technical support will be provided in case of a database modification outside VirtualDJ.  
  
  

[Wiki HOME](https://www.virtualdj.com/wiki/index.html)