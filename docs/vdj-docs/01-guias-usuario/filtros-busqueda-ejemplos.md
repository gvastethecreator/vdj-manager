---
title: "VirtualDJ - User Manual - Appendix - Filter Folder Examples"
source: "https://www.virtualdj.com/manuals/virtualdj/appendix/filtersyntax.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Appendix](https://www.virtualdj.com/manuals/virtualdj/appendix/index.html)  # Filter Folder Examples

  
Below are some examples that can be used to create and/or modify your own Filter Folders. Understand that this is only a guide and filter scripts can be changed to your individual preferences.  
  

**POPULAR FILTERS**

  

**FILTER**

**EXPECTED RESULT**

  

**isscanned=0**

Displays all files in the database that have **not** been analyzed

  

**isscanned=1**

Displays all files in the database that have been analyzed

  

**top 100 nbplay**

Displays the top 100 files played based on the play count field

  

**top 100 firstseen**

Displays the top 100 recently added files

  

**days since lastplay<7**

Files played in the last week

  

**days since lastplay<31**

Files played in the last month

  

**days since lastplay<365**

Files played in the last year

  

**lastplay=0**

Displays files that have never been played

  

**Play Count>=1**

Displays files that have been played at least once

  

**type=audio**

Displays only Audio files

  

**type=video**

Displays only Video files

  

**type=karaoke**

Displays only Karaoke files

  

**year>=1980 and year<1990**

Displays files from the 1980's (1980 - 1989)

  

**hascover=1**

Displays files that have cover art

  

**hascover=0**

Displays files with no cover art

  

**Precomputed Stems =1**

Displays all files with pre-computed Stems

  

**bpm>120 and bpm<130**

Displays files with a BPM range between 120 and 130

  
  

**DATABASE FILTERS**

  

**FILTER**

**EXPECTED RESULT**

  

**isscanned=0**

Displays all files in the database that have **not** been analyzed

  

**isscanned=1**

Displays all files in the database that have been analyzed

  

**exists=1**

Displays all files that have been added to the search database

  

**exists=0**

Displays all missing files from the search database

  

**days since first seen <10**

Displays all files that have been added to the database in the last 10 days

**group by year range 10**

Displays year tags in groups of 10 (example: 2000 - 2010)

  
  

**TAG MANAGEMENT FILTERS**

  

**FILTER**

**EXPECTED RESULT**

  

**Artist is ""**

Displays all files in the database that have no artist in the tag

  

**Title is ""**

Displays all files in the database that have no title in the tag

  

**Genre is ""**

Displays all files in the database that have no genre in the tag

  

**bitrate < 128 and bitrate >1**

Displays all files that have been analyzed with an audio bitrate less than 128 (low bitrate)

  

**Album Art = 0**

Displays all files that have no cover art attached to the files tag

  
  

**MIXING FILTERS**

  

**FILTER**

**EXPECTED RESULT**

  

**group by bpm**

Displays all bpm values in nested folders

  

**bpm>=90 and bpm <=95**

Displays all files that have been analyzed in the 90 - 95 BPM range

  

**Bpm Difference <2 and Key Difference <1**

Displays files that are compatible to the file playing in the active deck with a difference of less than 2 BPM and less than 1 key change

  
  

**COLOR FILTERS**

  

**FILTER**

**EXPECTED RESULT**

  

**color = "none"**

Displays all files with no color associated with them

  

**color = "red"**

Displays all files that are colored red

  

**color = "#FF0000"**

Displays all files that are colored with that hex value (red in the example)

  

**color = "255,0,0"**

Displays all files that are colored with that RGB value (red in the example)

  

**group by color**

Displays all files in nested folders according to their specified color

  
  
  
  
  
  
  
[List of Options](https://www.virtualdj.com/manuals/virtualdj/appendix/optionslist.html)