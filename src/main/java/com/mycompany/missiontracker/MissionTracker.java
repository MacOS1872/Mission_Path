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
        String name;
        String destination;
        String launchDate;

        Mission(String n, String d, String date) {
            name = n;
            destination = d;
            launchDate = date;
        }
    }

    public static void main(String[] args) {
        port(4567);

        // Tell Spark where to find HTML, CSS, JS
        staticFiles.location("/public");
        
        List<Mission> missions = new ArrayList<>();
        missions.add(new Mission("Apollo 11", "Moon", "1969-07-16"));
        missions.add(new Mission("Artemis I", "Moon", "2022-11-16"));

        Gson gson = new Gson();

        get("/missions", (req, res) -> {
            res.type("application/json");
            return gson.toJson(missions);
        });

        get("/mission/:name", (req, res) -> {
            String missionName = req.params(":name").toLowerCase();
            for (Mission m : missions) {
                if (m.name.toLowerCase().equals(missionName)) {
                    res.type("application/json");
                    return gson.toJson(m);
                }
            }
            res.status(404);
            return "Mission not found";
        });
    }
    
}
