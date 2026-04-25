---
title: "VirtualDJ - VDJPedia - Skin songpos"
source: "https://www.virtualdj.com/wiki/Skin%20songpos.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<songpos>* element**

---

---

  
  
The songpos is a special slider that is used to display and set the song position, display the song's structure, it will also display your Hot Cues and other POI markers.  
  
***Basic*** *- this is your standard horizontal waveform as seen in most skins.*  
The syntax of the songpos element is *<songpos deck="" colorPlayed="" colorBass="" colorMed="" colorHigh="">*  

- *deck* is the deck number the element will apply to
- *colorPlayed* set the color to display once the song has been played
- *colorBass* set the color for the low frequencies
- *colorMed* set the color for the medium (mid) frequencies
- *colorHigh* set the color for the high frequencies
- *colorVocal* set the color for the Vocals (VirtualDJ 2021+)
- *colorInstru* set the color for the Instrumental (VirtualDJ 2021+)
- *colorBeat* set the color for the Beat (VirtualDJ 2021+)
- *colorNoVocal* set the color for when the Vocals are killed (VirtualDJ 2021+)
- *colorNoInstru* set the color for when the Instrumental is killed (VirtualDJ 2021+)
- *colorNoBeat* set the color for when the beat is killed (VirtualDJ 2021+)

*n.b. colorBass, colorMed and colorHigh are optional (VirtualDJ will automatically use default colors if not define) and only used when coloredWaveforms is set to monochrome.*  
  
The *<songpos>* element has these children:  

- *<pos x="" y="">* : give the position of the element.
- *<size width="" height="">* : Give the width and height of the element.
- *<cues>* : The <cues> child (to define the Cue Markers has these children:  

- *<size width="" height="">* : Give the width and height of the cue sprite
- *<up x="" y="">* : give the cue sprite graphic
- *<down x="" y="">* : give the graphic to be used when the cue is pushed
- *<over x="" y="">* : give the graphic to be used when the mouse is over the cue
- *<clipmask x="" y="">* : Give the coordinate of the B&W graphic that should be used as a clip mask when drawing the cue
- *<loops>* : Same as <cues> to define the Saved Loop Markers

*Example:*  
```
<songpos deck="left" colorPlayed="#00a5e4" colorBass="#00567a" colorMed="#00a5e4" colorHigh="#7fc8e9" >
	 <size height="45" width="250"/>
	 <pos x="100" y="350"/>
	 <cues>
	 	 <size width="18" height="52"/>
	 	 <clipmask x="344" y="1140"/>	
	 	 <up x="363" y="1140"/>
	 	 <down x="363" y="1140"/>
	 	 <over x="401" y="1140"/>
	 </cues>
</songpos>
```
  
***Special*** *- in principle exactly the same as above but some additional options.*  
The syntax of the songpos element is *<songpos deck="" orientation="" waveform="">*  

- *deck* is the deck number the element will apply to
- *orientation* : Possible values:  
\[list\]
- *horizontal*, for a simple horizontal slider
- *vertical*, for a simple vertical slider
- *circle*, for a circular slider
- *round*, for a knob-like button

\[/list\]It has all the properties and definitions of a *<slider>*, plus those:  

- *<down x="" y="">* : Give the graphic to use for portions of the song not played yet, and without any volume
- *<volume x="" y="">* : Give the graphic to use for portions of the song not played yet, and with a maximum volume (the display will be a fade between down and volume)
- *<selected x="" y="">* : Give the graphic to use for portions of the song already played, and without any volume
- *<volumeselected x="" y="">* : Give the graphic to use for portions of the song already played, and with a maximum volume (the display will be a fade between selected and volumeselected)
- *<upselected x="" y="">* : Give the graphic to use for background of the played part
- *<cues>* : Define the sprites to be used as CUE markers (and <loops> for the Saved Loop Markers). Includes the following children:  
\[list\]
- *<size width="" height="">* : Give the width and height of the cue sprite
- *<up x="" y="">* : give the cue sprite graphic
- *<down x="" y="">* : give the graphic to be used when the cue is pushed
- *<over x="" y="">* : give the graphic to be used when the mouse is over the cue
- *<clipmask x="" y="">* : Give the coordinate of the B&W graphic that should be used as a clip mask when drawing the cue

\[/list\]  
  
```
<songpos colorPlayed="colorplay" orientation="horizontal" colorHigh="colorHigh" colorMed="colorMed" colorBass="colorBass" colorVocal="#075CDB" colorInstru="#0AC200" colorBeat="#FFFFFF" colorNoBeat="#000000" >
	   <pos x="+6+1" y="+93"/>
	   <size width="501+115+60+65-220" height="34"/>
	  <wave>
	  	  <size height="25"/>
	  	  <pos y="+5"/>
	  </wave>
	  <cues dy="0" shade="0">
	  	  <size width="13" height="13"/>
	  	  <clipmask x="1522" y="43"/>
	  </cues>
	  <loops dy="0" shade="0">
	  	  <size width="13" height="13"/>
	  	  <clipmask x="1545" y="43"/>
	  </loops>
</songpos>
```
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)