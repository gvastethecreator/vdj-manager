---
title: "VirtualDJ - VDJPedia - Custom Browser"
source: "https://www.virtualdj.com/wiki/Custom%20Browser.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html) [Back to <browser>](https://www.virtualdj.com/wiki/Skin%20Browser.html)

  
**Skin SDK - Custom Browser**

---

---

  
The default Browser of VirtualDJ can be customized by using the following elements instead of the <browser> one, and place its elements anywhere inside a skin.  
  
**Basic Browser Lists elements** *(see Example 1)* :

- *<folderlist>* : Provides the Folders List (without it's the vertical toolbar)
- *<browsertoolbartree>* : Provides the vertical toolbar of the Folders List
- *<fileview>* : Provides the Songs List (including the List, the Covers flow and the Search/Edit horizontal toolbar)  
The <fileview> element can be also replaced with the following elements : *(see Example 2)* \[list\]
- *<browsertoolbar>* : Provides the Horizontal Search bar of the Songs List (with Search bar, Search Options and
- *<coverflow>* : Provides the Covers Flow list. See detals in [Skin Coverflow](https://www.virtualdj.com/wiki/Skin%20Coverflow.html)
- *<filelist>* : Provides the Songs List (without Covers Flow and Search)

- *<sideview>* : Provides the Sideview including all views (Automix, Sidelist, Karaoke, Sampler and Shortcuts) including the Info of the lists and the bottom navigation toolbar
- *<browserinfo>* : Provides the Info area of the default Browser with Info of the selected song and the Prelisten Player. See details in [Skin Browserinfo](https://www.virtualdj.com/wiki/Skin%20Browserinfo.html)
- *<pluginzone>* : Provides the area where the GUIs of the Effects are docked. (you will need to have name="effects" in the split if you want this area to be automatically resized when an Effect GUI is docked)\[/list\]  
**Additional elements** :

- *<sampler>* : Provides the Sampler in Trigger-pad view (without the top menu to select Bank, Trigger mode etc)
- *<filelist source="sideview">* : Provides the Lists of the Sideview without the top menu and the bottom navigation buttons. (automatically offers the List depending on the selected view of the Sideview). Use this element if you need to customize the top menu and the bottom navigation buttons.
- *<filelist source="automix|karaoke|sidelist|sampler">* : Provides the specific List of the Sideview (Automix, Karaoke, Sidelist and Sampler) without the top info bar and the bottom navigation buttons. Use this element if you need to explicitly display a Sideview List. (e.g. have Automix to a separate area and always have that on sight)

  
  
**Parameters:** :

- *attachX="left|right|both" attachY="up|down|both" resizeX="yes|no" resizeY="yes|no"* can be used if the Lists are part of a <split> panel see [Split Panels](https://www.virtualdj.com/wiki/Split%20Panel.html)
- *grid="yes"* : (optional) By default, all List elements will follow the Grid/List view selection. Use *grid="yes"* if you want the List to be displayed always in Grid View
- *lineheight=""* : (optional) Define the height of the Browser Lists Lines. lineheight="1.5" will set the line height to 150% compared to the default one (1.0)
- *visibility="" :* (optional) use visibility="true|false" or a vdj script verb, to query the display of the element

  
**Children:**  
All the above elements require just the position and size to be defined as a **child element**

- *<pos x="" y="" />  
*
- *<size width="" height=""/>*
- same as <browser> , colors can be defined (optional). See [Skin Browser](https://www.virtualdj.com/wiki/Skin%20Browser.html)

  
  

![](https://www.virtualdj.com/img/222215/21606/BrwserDiagram.png)

  
*

Diagram of the Default Browser Elements inside Split panels

*  
  
**Example 1 :**  
The following code recreates a Browser of 1898 pixels in width, 509 pixels in height at X,Y 11,560 with the above elements in use. The example is using re sizable <split> elements, but the same elements can be used anywhere inside a skin (in case you need to display the Lists in separate areas)  
```
<split name="effects" type="horizontal" position="100%" grab="0">
<pos x="11" y="560"/>
<size width="1898" height="509"/>

<left>
<split name="info" type="horizontal" position="80%" grab="10">
<pos x="0" y="0"/>
<size width="1898" height="509"/>

<left>
<split name="folders" type="horizontal" position="25%" grab="10">
<pos x="0" y="0"/>
<size width="1898" height="509"/>

<left>
<browsertoolbartree resizeX="no" attachX="left">
<size width="35" height="509"/>
<pos x="0" y="0"/>
</browsertoolbartree>
<folderlist resizeX="yes" attachX="both">
<size width="1898-37" height="509"/>
<pos x="0+37" y="0"/>
</folderlist>
</left>
<right>
<split name="sideview" type="horizontal" position="70%" grab="10">
<pos x="0" y="0"/>
<size width="1898" height="509"/>

<left>
<fileview attachX="both" attachY="both">
<size width="1898" height="509"/>
<pos x="0" y="0"/>
</fileview>
</left>

<right>
<sideview>
<size width="1898" height="509"/>
<pos x="0" y="0"/>
</sideview>
</right>

<separator close="right" closed="no" size="16"  />
</split>

</right>

<separator close="left" size="16" closed="no" />

</split>

</left>

<right>
<browserinfo>
<size width="1898" height="509"/>
<pos x="0" y="0"/>
</browserinfo>
</right>

<separator close="right" size="16" closed="no" />

</split>

</left>

<right>
<pluginzone resizeX="no" resizeY="yes" attachX="both">
<size width="1898" height="509"/>
<pos x="0" y="0"/>
</pluginzone>
</right>

<separator close="right" closed="no" size="0"  />

</split>
```
  
  
The code above is equal to :  
```
<browser>
<pos x="11" y="560"/>
<size width="1898" height="509"/>
<browser>
```
  
  
  
**Example 2 :** The Songs List with additional Browser elements :  
The **<fileview>** element of the example above ...  
```
<fileview attachX="both" attachY="both">
<size width="1898" height="509"/>
<pos x="0" y="0"/>
</fileview>
```
  
... can be also offered using the **<browsertoolbar>**, **<coverflow>** and **<filelist>** elements as following..  
```
<browsertoolbar resizeX="yes" resizeY="no" attachX="both" attachY="up">
<size width="1898" height="40"/>
<pos x="0" y="0"/>
</browsertoolbar>

<split name="covers" type="vertical" position="15%" grab="5">
<pos x="0" y="44"/>
<size width="1898" height="509-44"/>

<up>

<coverflow attachX="both" attachY="both">
<size width="1898" height="509-44"/>
<pos x="0" y="0"/>
</coverflow>
</up>

<down>
<filelist attachX="both" attachY="both">
<size width="1898" height="509-44"/>
<pos x="0" y="0"/>
</filelist>
</down>

<separator close="up" closed="no" size="0"  />
</split>
```
  
  
**Skin Example:**  
You can download a demo skin with a combination of Example 1 and 2 from [http://www.virtualdj.com/files/SDK%20Example%20-%20Custom%20Browser%20Skin.zip](http://www.virtualdj.com/files/SDK%20Example%20-%20Custom%20Browser%20Skin.zip)  
  
**More in depth:**  
Apart from the Lists (Folders, Files,Sideview etc) that can be added to a skin and create a custom Browser, every single part can be customized including the left-side vertical Toolbar, the top menu of the Sideview, the content of the File Info view, create a dedicated Prelisten Player etc.  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html) [Back to <browser>](https://www.virtualdj.com/wiki/Skin%20Browser.html)