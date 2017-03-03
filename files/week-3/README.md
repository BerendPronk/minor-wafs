#Stiphy  
##Stories supported by the Giphy API

Everyone has a story to tell. An term that's often mentioned is: 'Show, don't tell'. Stiphy works exactly with that in mind.  
Enter your story in the textarea, make sure it's writting down in correct English, and press on 'Submit' once you're done.

You'll be presented with your own story, but some of the words will be replaced by random gif-images from the amazing Giphy API (https://api.giphy.com/). If you are willing to explore more randomized images, you can! Click on a gif-image from your story and receive a new set of images based on the synonyms of the chosen word. Those new images are clickable as well, so you can infinitely loop through the funny animated images the web has to offer!

View [demo](https://berendpronk.github.io/minor/wafs/files/week-3/final-assignment/)

###Usage
**1:** Think of a story you would like to see converted into a random gibberish of animated images.  
**2:** Enter your chosen story into the textarea.  
**3:** Click the 'Submit' button and wait till the Parallel Dots API finishes retrieving keywords from your input.  
**4:** See your story appear on a new page with random images spread throughout.  
*(Repeat the previous processes, if you want to add another story, by navigating to the 'send' page.)*  
**5:** Sort or filter by using the different controls at the top of the storylist.  
**6:** Click on an image to retrieve a list of synonyms with corresponding gif-images.  
**7:** Go back to your stories by navigating to the 'stories' page.  

You now know how to use Stiphy. Share if you would liek others to experience the same you just did.

###So how does it all work? (in a nutshell)
Every time a user submits an input in the 'send' section of the single-page application, a POST request is made to the Parallel Dots API (https://www.paralleldots.com/), in order to find certain keywords in the submitted story.  

The entire story will be stored inside of a array, which'll later be rendered as an unordered list with a list-item for every word. The keywords will be replaced with animated images from Giphy before that happens, however. This is done via a GET request.
If a new story is to be added, the application will place it at the top of the storylist, as a new unordered list. This was the data is easiliy mantainable, since the stories are not contained within the same list, but in individual lists instead.

When a user clicks a gif-image, a GET request will be made to the Yandex Dictionary API (https://tech.yandex.com/dictionary/), which looks for synoynms on the selected word. These synonyms will be rendered inside a new list of images from Giphy. This click-event is fired on the synonym images as well, so the user is able to search through Giphy's database by just clicking the words he wants to see moving images of.

Every story, with gif-images included, are saved in the localstorage of the users browser. This way the user will not lose the stories if a accidental refresh is made, or if the user decided to revisit the application to take a look at his or her stories once more.

###Feature wishlist
This application is not done yet. There are a few features I would like to include:
- A way to choose between multiple gif-images for each keyword.
- Retrieving the entire stories as images, for users to download / print.
- Social media integration (not because I want that, but because it's cool, or something).

Besides these items, I think it would be nice to refactor the script the application uses, once more. By doing so, I'll be able to learn more about the structure, and possibly be able to write it in a neater package.

###Object Method Diagram
![Object Method Diagram](https://berendpronk.github.io/minor/assets/object-method-diagram.jpg)

###Flowchart
![Flowchart](https://berendpronk.github.io/minor/assets/flowchart.jpg)

###About
I learned about the possibilities of Giphy while using Slack during one of my internships. When I got the opportunity to build a single-page application that needed to include an API, I almost immediatly thought of using the Giphy API. It was a nice first case for me to experiment with the functionalities and uses of different third-party API's.

---

Made by Berend Pronk.

Made possible by the following API's:  
- Giphy (https://api.giphy.com/), used for retrieving randomized animated gif-images. 
- Parallel Dots (https://www.paralleldots.com/), used for retrieving advanced keyword. 
- Yandex (https://tech.yandex.com/dictionary/), used for retrieving synonyms on keywords 

Amsterdam University of Applied Sciences, Communication and Multimedia Design - 2017
