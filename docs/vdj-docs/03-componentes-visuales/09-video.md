---
title: "VirtualDJ - VDJPedia - Skin Video"
source: "https://www.virtualdj.com/wiki/Skin%20Video.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<video>* element**

---

---

  
This element is used to create video preview displays.  
  
**Syntax:**  
*<video source="" linkdrop="" deck="" visibility="" os="" panel="">*  
  
**Inherited Attributes**: *deck="" visibility="" os="" panel=""*  
See [Global Element Attributes](https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html)  
  
  
**Other Attributes :**  

  
- *source="master|deck"* : What source this video is previewing; if not set to "deck" then the master will be previewed.
- *linkdrop="true|false"* : Optional attribute. Set to *false* (default is true) to bypass the setting *videoCreateLinkOnDrop* and force to not create Video Edits when a track is dropped in this area .

  
  
  
**Children:**

- *<pos x="" y=""/>* : Give the position of the video preview on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and height of the video preview. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<background color=""/> or <background x="" y=""/>* : (optional) Define the graphics that the video preview element will use when no video is displayed (track is an audio file or Video Engine is turned off). Alias for the standard control child *<up>*

  
  
**Example 1:**  
*Will always provide the Video Output of Deck 1*  
```
<video source="deck" deck="1">
	<pos x="0" y="50"/>
	<size width="160" height="90"/>
	<background color="black"/>
</video>
```
  
  
**Example 2:**  
*Will provide the Video Output of whatever deck is assigned Left or Right (with deck x leftdeck|rightdeck action)*  
```
<video source="deck" deck="left">
	<pos x="0" y="50"/>
	<size width="160" height="90"/>
</video>
```
  
  
**Example 3:**  
*Will provide the Video Output of whatever deck is assigned Left or Right side of the Video Crossfader (with deck x leftvideo|rightvideo action)  
If no deck is assigned as leftvideo|rightvideo, the Video Output of the deck assigned as leftdeck|rightdeck will be provided*  
```
<video source="deck" deck="rightvideo">
	<pos x="0" y="50"/>
	<size width="160" height="90"/>
</video>
```
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)