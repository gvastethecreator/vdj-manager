---
title: "VirtualDJ - VDJPedia - Browser in Window"
source: "https://www.virtualdj.com/wiki/Browser%20in%20Window.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Wiki HOME](https://www.virtualdj.com/wiki/index.html)

  
**How to create a Floated Window with Browser**

---

  
  
Here is how you can easily have the Browser on a floated (movable and resizable) Window, e.g. if you wish to have the Browser on a secondary screen  
  
In this example we will use the 4 Decks default skin.  
  

- Unzip the VirtualDJ 8.zip file to a folder.
- Keep just 2 files, the 4 Decks.xml and the 4 Decks.png and delete the others.
- Open the 4 Decks.xml with a Text or an XML Editor.
- Add the following lines at the bottom of the xml file, just one line before its </skin> end line  
The bottom part of the XML should look like this..  
```
.......
<window name="BrowserWindow"  posx="100" posy="100" width="1024" height="768" image="4 Decks.png" shown="true" >
	<browser>
		<size width="1024-10" height="768-10"/>
		<pos x="5" y="5"/>
	</browser>
</window>

</Skin>
```
- Zip those 2 files , provide a name for the zip file and place it into the Skins folder. Open VirtualDJ and load the skin from the INTERFACE tab.

  
  
Window element parameters

  
- **name**: use whatever name you want. The name will be used to open/close the window, using the action **show\_window 'nameofthewindow'**
- **posx, posy** : Define the position on your primary screen that the Window will appear when the skin is launched for the first time. If you move the window to a different position, the new posx, posy values will be saved across sessions and the values from the xml will not be taken into account.
- **width, height** : Define the width and height that the window will have when the skin is launched for the first time. If you resize the window, the new dimensions will be saved across sessions, and the width, height values of the xml will not be taken into account.
- **image** : provide the name of the image file that the elements inside the window will take graphics from. Since no special graphics are needed in this case, you can use the graphics file that the original skin uses.
- **shown** : true/false. When set to false, the window will be hidden when the skin loads for the first time. The status (hidden/displayed) is memorized across sessions, so this parameter defines if the window will be visible or not when the skin loads for the **first time**.

  
  
  
Once the skin is loaded, the floated window with the Browser will appear. You can then resize it and move it to your secondary screen by grabbing the edges (that is why in the example above, the width and height of the <browser> have -10 pixels compared to the width and height of the window and the x,y position of the browser start from pixel 5,5)  
  
  
Alternatively, you may use **Browser Tweaks,** a Windows application which among others, offers the ability to add a Browser to a floating window  
[http://www.virtualdj.com/plugins/index.html?addonid=80491](http://www.virtualdj.com/plugins/index.html?addonid=80491)  
  

---

[Wiki HOME](https://www.virtualdj.com/wiki/index.html)