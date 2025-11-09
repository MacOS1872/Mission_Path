/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */

package com.mycompany.missiontracker;

import static spark.Spark.*;
import com.google.gson.Gson;
import java.util.*;
/**
 *
 * @author mac
 */
public class MissionTracker {

    static class Mission {
    String key;        
    String name;      
    String destination;
    String planetName; 
    String launchDate;
    String summary;
    String desc;

    Mission(String key, String name, String dest, String planetName, String date,  String desc, String summary) {
        this.key = key;
        this.name = name;
        this.destination = dest;
        this.planetName = planetName; 
        this.launchDate = date;
        this.desc = desc;
        this.summary = summary;
    }
}

    public static void main(String[] args) {
        port(4567);

        // Tell Spark where to find HTML, CSS, JS
        staticFiles.location("/public");
        
        List<Mission> missions = new ArrayList<>();
        missions.add(new Mission("apollo11", "Apollo 11", "Moon", "Moon", "1969-07-16", "Apollo 11 was the First manned moon landing in history.", "Fun Facts: The ladder on the Appollo 11 mission aircraft was 3.5 feet short, meaning Neil Armstrong had to fall off the lander to land on the moon. Neil Armstrong left"
                +                                                                                                                                                                  "a olive garden made of gold on the moon. When the boosters on the aircraft for Appollo 11 malfunctioned, the Appollo 11 crew had to use a felt tip pen to mannually activate "
                +                                                                                                                                                                  "the boosters so they could land safely;"));
        missions.add(new Mission("voyager1", "Voyager 1", "Interstellar Space", "", "1977-09-05", "Farthest human-made object.", "Fun Facts: Many scientists are amazed that the voyager has still been operational in space for over 40 years. The Voyager is currently the furthest object the earth has launched into outer space."));
        missions.add(new Mission("mars2020", "Mars 2020", "Mars", "Mars", "2020-07-30", "Mars rover mission to Jezero Crater.", "Fun Facts: Scientist believed  that many years ago there used to be life on Mars, specifically  in the Jezero Crater. The rover used for the Mars 2020 mission had mining capabilities"
                +                                                                                                                                           "used to retrieve samples for observation"));
        missions.add(new Mission("hubble", "Hubble Telescope", "Earth orbit", "", "1990-04-24", "Space telescope orbiting Earth.", "Fun Facts: Scientist allowed the Hubble telescope to stare at nothing to see how far the Hubble telescope could take pictures. After 10 days of staring, the Hubble telescope was able to"
                +                                                                                                                                              "take the Hubble Deep Field picture, this picture depicted galaxies beyond the Milky Way, that have never been seen before in human history. The Hubble telescope only take pictures in "
                +                                                                                                                                              "black and white, but through technology, scientist can use filters to sometimes predict the color of the image."));
        missions.add(new Mission("juno", "Juno Mission", "Jupiter", "Jupiter", "2011-08-05", "Jupiter exploration probe.", "Fun Facts: The spacecraft Juno was the first solar powered spacecraft to reach Jupiter. It took Juno 5 years to reach the planet Jupiter. Jupiter was initially  supposed to orbit Jupiter for 14 days, "
                +                                                                                                                                      "to perform scientific research but due to a malfunction in Juno's main thruster, it could not perform a scientific orbit and was stuck in Jupiter's orbit for 53 days, eventually Juno go close enough"
                +                                                                                                                                      "to perform scientific research orbits."));

        Gson gson = new Gson();

        get("/missions", (req, res) -> {
            res.type("application/json");
            return gson.toJson(missions);
        });

        get("/mission/:name", (req, res) -> {
            String missionKey = req.params(":name").toLowerCase();
            for (Mission m : missions) {
                if (m.key.equals(missionKey)) {   
                res.type("application/json");
                return gson.toJson(m);
            }
        }
        res.status(404);
        return "Mission not found";
        });

    }
    
}
// Appollo 11 fun facts source: https://astronautfoods.com/blogs/news/15-facts-about-apollo-11-you-didnt-know
// Mars 2020 fun facts source #1: https://www.pbs.org/newshour/science/5-things-you-should-know-about-the-mars-2020-mission
// Mars 2020 fun facts source #2: https://www.jpl.nasa.gov/infographics/5-fun-engineering-facts-about-the-mars-2020-rover/
// Voyager 1 fun facts source: https://www.astronomytrek.com/10-interesting-facts-about-the-voyager-1-probe/
// Hubble fun facts source: https://www.history.com/articles/10-fascinating-facts-about-the-hubble-space-telescope