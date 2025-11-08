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

    public static void main(String[] args) {
        port(4567); // optional, default is 4567

        get("/", (req, res) -> "Hello from Spark Java!");

        get("/missions", (req, res) -> {
            res.type("application/json");
            return "[{\"name\":\"Apollo 11\",\"destination\":\"Moon\"}]";
        });
    }
}
