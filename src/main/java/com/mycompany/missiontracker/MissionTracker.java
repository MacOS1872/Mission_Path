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
        String launchDate;
        String summary;

        Mission(String key, String name, String dest, String date, String summary) {
            
            this.key = key;
            this.name = name;
            this.destination = dest;
            this.launchDate = date;
            this.summary = summary;
        
        }
    }


    public static void main(String[] args) {
        port(4567);

        // Tell Spark where to find HTML, CSS, JS
        staticFiles.location("/public");
        
        List<Mission> missions = new ArrayList<>();
        missions.add(new Mission("apollo11", "Apollo 11", "Moon", "1969-07-16", "First manned moon landing."));
        missions.add(new Mission("voyager1", "Voyager 1", "Interstellar Space", "1977-09-05", "Farthest human-made object."));
        missions.add(new Mission("mars2020", "Mars 2020", "Mars", "2020-07-30", "Mars rover mission to Jezero Crater."));
        missions.add(new Mission("hubble", "Hubble Telescope", "Earth orbit", "1990-04-24", "Space telescope orbiting Earth."));
        missions.add(new Mission("juno", "Juno Mission", "Jupiter", "2011-08-05", "Jupiter exploration probe."));




        Gson gson = new Gson();

        get("/missions", (req, res) -> {
            res.type("application/json");
            return gson.toJson(missions);
        });

        get("/mission/:name", (req, res) -> {
            String missionKey = req.params(":name").toLowerCase();
            for (Mission m : missions) {
                if (m.key.equals(missionKey)) {   // compare to key
                res.type("application/json");
                return gson.toJson(m);
            }
        }
        res.status(404);
        return "Mission not found";
        });

        
        

    }
    
}
