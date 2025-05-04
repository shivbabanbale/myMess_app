package com.app.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.model.WeeklyMenu;
import com.app.repository.WeeklyMenuRepository;
import com.app.service.WeeklyMenuService;

@Service
public class WeeklyMenuServiceImpl implements WeeklyMenuService {

    @Autowired
    private WeeklyMenuRepository menuRepository;
    
    @Override
    public WeeklyMenu saveMenu(WeeklyMenu menu) {
        // Set last updated timestamp
        menu.setLastUpdated(System.currentTimeMillis());
        return menuRepository.save(menu);
    }

    @Override
    public WeeklyMenu getMenuByMessEmail(String messEmail) {
        return menuRepository.findByMessEmail(messEmail);
    }
    
    @Override
    public WeeklyMenu getLatestMenuByMessEmail(String messEmail) {
        return menuRepository.findTopByMessEmailOrderByLastUpdatedDesc(messEmail);
    }

    @Override
    public void deleteMenu(String menuId) {
        menuRepository.deleteById(menuId);
    }

    @Override
    public boolean menuExistsForMess(String messEmail) {
        return menuRepository.existsByMessEmail(messEmail);
    }
} 